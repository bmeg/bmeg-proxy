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
from elasticsearch import Elasticsearch


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


class ElasticHandler(tornado.web.RequestHandler):
    """ handle elastic requests """

    def initialize(self, url, index="animaltree"):
        self.url = url
        self.index = index

    @tornado.gen.coroutine
    def get(self, path=None):
        """ async GET call to ES see http://bit.ly/2rWlBeR """

        @tornado.gen.coroutine
        def _search_elastic():
            """ threadsafe & tornado friendly way to call ES """
            es = Elasticsearch()
            # for explaination, see
            # http://www.tornadoweb.org/en/stable/gen.html#utility-functions
            raise tornado.gen.Return(es.msearch(body=self._aggregation(path)))

        response = yield _search_elastic()
        self.write(response)
        self.finish()

    def _aggregation(self, path=None):
        """ utility, create msearch body from request """
        query_string = self.get_query_argument('q', '*')
        aggs = self.get_query_argument('aggs', None)
        if aggs:
            aggs = aggs.split(',')
        else:
            aggs = []
        print query_string, aggs
        body = []
        index = self.index
        # create count aggregation for each field
        for property_name in aggs:
            body.extend(
                [
                    {"index": index,
                     "ignore_unavailable": True, "preference": 1},
                    {
                        "size": 0,
                        "query": {"query_string": {"analyze_wildcard": True,
                                                   "query": query_string}},
                        "aggs": {
                            property_name: {
                                "terms": {
                                    "field": "%s.keyword" % property_name,
                                    "order": {"_term": "asc"}
                                }
                            }
                        }
                    }
                ]
            )
        # get page of details, user must set
        _from = self.get_query_argument('from', 0)
        size = self.get_query_argument('size', 0)
        body.extend(
            [
                {"index": index, "ignore_unavailable": True, "preference": 1},
                {
                    "size": size,
                    "from": _from,
                    "query": {"query_string": {"analyze_wildcard": True,
                                               "query": query_string}}
                }
            ]
        )
        return body


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
        (r"^/edge/find/(.*)", ProxyHandler,
            dict(url="%s/edge/find/" % args.main)),
        (r"^/gaia/gene/(.*)/find/(.*)",
            ProxyHandler, dict(url="%s/gaia/vertex/find/" % args.main)),
        (r"^/search[/]?(.*)",
            ElasticHandler, dict(url="%s" % args.main)),
        (r"^/(.*)", NoCacheStaticFileHandler,
            dict(path=SITE_DIR, default_filename="index.html")),
        #  (r"^(.*)", ProxyHandler, dict(url=args.main)),
        ],
        debug=args.debug
    )

    application.listen(args.port)
    tornado.ioloop.IOLoop.instance().start()
