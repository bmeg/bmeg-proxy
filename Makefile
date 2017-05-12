

site-build:
	hugo -d site

server:
	./proxy.py http://bmeg.io

dev-server:
	hugo server
