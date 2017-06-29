package main

import (
	"log"
	"fmt"
	"flag"
	"net/http"
	"net/http/httputil"
	//"net/url"
)

func NewReverseProxy(dst string) *httputil.ReverseProxy {
	return &httputil.ReverseProxy{
		Director: func(req *http.Request) {
			req.URL.Scheme = "http"
			req.URL.Host = dst
			req.Host = dst
			log.Printf("REQ: %s", req.URL)
		},
	}
}

func main() {
	port := flag.Uint("-p", 8000, "Proxy Port")
	flag.Parse()

	log.Printf("%s", flag.Arg(0))

	proxy := NewReverseProxy(flag.Arg(0))

	mux := http.NewServeMux()

	fs := http.FileServer(http.Dir("./site"))
	mux.Handle("/vertex/", proxy)
	mux.Handle("/schema/protograph", proxy)
	mux.Handle("/vertex/find", proxy)
	mux.Handle("/edge/find", proxy)
	mux.Handle("/search/counts", proxy)
	mux.Handle("/", fs)
	http.ListenAndServe(fmt.Sprintf(":%d", *port), mux)
}
