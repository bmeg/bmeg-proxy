#!/usr/bin/env python

import os
import argparse
import tornado
import tornado.web
import urllib2
import thread
import threading
import time
import json
import subprocess
from jinja2 import Template
from tornado.concurrent import Future
from tornado.httpclient import AsyncHTTPClient


TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                            "templates")
SITE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "site")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class NoCacheStaticFileHandler(tornado.web.StaticFileHandler):
    def set_extra_headers(self, path):
        self.set_header("Cache-control", "no-cache")


class ProxyHandler(tornado.web.RequestHandler):

    def initialize(self, url):
        self.url = url

    @tornado.web.asynchronous
    @tornado.gen.engine
    def get(self, path=None):
        """ async GET call to BMEG vertex/query """
        url = self.url
        if path is not None:
            url = url + path
        print "Proxy GET to %s" % url
        http_client = AsyncHTTPClient()
        response = yield http_client.fetch(url)
        if response.error:
            self.write("Error: %s" % response.error)
        else:
            self.write(response.body)
        self.finish()

    @tornado.web.asynchronous
    @tornado.gen.engine
    def post(self, path=None):
        """ async POST call to BMEG vertex/query """
        url = self.url
        if path is not None:
            url = url + path
        payload = self.request.body
        print "Proxy POST to %s request: %s" % (url, payload)
        headers = {'Content-Type': 'application/json',
                   'Accept': 'application/json'}
        http_client = AsyncHTTPClient()
        response = yield http_client.fetch(url, method="POST", body=payload,
                                           headers=headers)
        if response.error:
            self.write("Error: %s" % response.error)
        else:
            self.write(response.body)
        self.finish()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("main")
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--debug", default=False, action="store_true",
                        help="Turns on autoreload and other debug features")

    args = parser.parse_args()

    application = tornado.web.Application([(r"^/()$",
                                            NoCacheStaticFileHandler,
                                            dict(path=os.path.join(SITE_DIR, "index.html"))),  # NOQA
        # (r"^/static/(.*)", NoCacheStaticFileHandler, dict(path=STATIC_DIR) ),
        (r"^/vertex/query", ProxyHandler,
            dict(url="%s/vertex/query" % args.main)),
        (r"^/schema/protograph", ProxyHandler,
            dict(url="%s/schema/protograph" % args.main)),
        (r"^/vertex/find/(.*)", ProxyHandler,
            dict(url="%s/vertex/find/" % args.main)),
        (r"^/gaia/gene/(.*)/find/(.*)",
            ProxyHandler, dict(url="%s/gaia/vertex/find/" % args.main)),
        (r"^/(.*)", NoCacheStaticFileHandler,
            dict(path=SITE_DIR, default_filename="index.html")),
        #  (r"^(.*)", ProxyHandler, dict(url=args.main)),
        ],
        debug=args.debug
    )

    application.listen(args.port)
    tornado.ioloop.IOLoop.instance().start()
