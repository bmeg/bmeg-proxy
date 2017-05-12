

site-build:
	./node_modules/.bin/webpack -d
	hugo -d site

server:
	./proxy.py http://bmeg.io

dev-server:
	hugo server
