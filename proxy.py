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

TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class NoCacheStaticFileHandler(tornado.web.StaticFileHandler):
    def set_extra_headers(self, path):
        self.set_header("Cache-control", "no-cache")

class ProxyHandler(tornado.web.RequestHandler):
    
    def initialize(self, url):
        self.url = url
    
    def get(self, path=None):
        url = self.url
        if path is not None:
            url = url + path
        request = urllib2.Request(url)
        response = urllib2.urlopen(request)
        result = response.read()
        self.write(result)

    def post(self):   
        payload = self.request.body
        print "Proxy to %s request: %s" %(self.url, payload)
        headers = {'Content-Type': 'application/json', 'Accept': 'application/json'}
        request = urllib2.Request(self.url, payload, headers=headers)
        response = urllib2.urlopen(request)
        result = response.read()
        self.write(result)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("main")
    parser.add_argument("--port", type=int, default=8080)

    args = parser.parse_args()

    application = tornado.web.Application([
        (r"^/()$", NoCacheStaticFileHandler, dict(path=os.path.join(STATIC_DIR, "main.html"))),
        (r"^/static/(.*)", NoCacheStaticFileHandler, dict(path=STATIC_DIR) ),
        #(r"^/gaia/vertex/query", ProxyHandler, dict(url="%s/gaia/vertex/query" % args.main)),
        #(r"^/gaia/vertex/find/(.*)", ProxyHandler, dict(url="%s/gaia/vertex/find/" % args.main) ),
        #(r"^/gaia/gene/(.*)/find/(.*)", ProxyHandler, dict(url="%s/gaia/vertex/find/" % args.main) ),
        (r"^(.*)", ProxyHandler, dict(url=args.main)),
    ])

    application.listen(args.port)
    tornado.ioloop.IOLoop.instance().start()
