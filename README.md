BMEG Proxy
----------

The HTML build of bmeg.io and web proxy


# Build Site

To compile the javascript with webpack, first install npm, then the node modules:

    npm i -S

To install hugo
  
  brew install hugo

or 

  apt-get install hugo
  
# Install python dependencies

  pip install -r requirements.txt

To Build the site:

  make
  
# Running Proxy

Easy version:

    make server

Manual version: provide the proxy an accessible bmeg instance:

    python proxy.py http://bmeg.io --port 8080

Then when you navigate to `http://localhost:8080` it will be a local mirror of the remote system, but with all markup and javascript editable locally!
