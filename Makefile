
go-server:
	go run bmeg-proxy.go bmeg.io:80

site-build:
	./node_modules/.bin/webpack -d
	hugo -d site

server:
	./proxy.py http://bmeg.io

dev-server:
	hugo server
