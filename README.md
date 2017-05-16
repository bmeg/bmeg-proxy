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

#  Adding content to the site

The BMEG site it built via hugo HTML templating system https://gohugo.io/
The content is held in the `content` directory. Each page is done in markdown
and there is a stanza at the start of the file that represents a YAML config file.
These parameters are used to config the template when generating the HTML page.

Example:
```
---
search: true
title: Response Compare
javascript:
  - https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js
  - https://fb.me/react-0.14.2.js
  - https://fb.me/react-dom-0.14.2.js
  - https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.23/browser.min.js
  - https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.6/d3.min.js
  - /js/bmeg.js
---

```

Then in the markdown, drop in the div elements that your javascript will use.

# Static content

The contents of the `static` directory will be copied directly into the site. Images and Javascript can be placed there.

# Site Template

The site template can be found in `themes/bmeg/`. The template engine description can 
be found at https://gohugo.io/templates/overview/. The main site page is `themes/bmeg/layouts/index.html`
Partial templates (which are fragments embedded in parent templates) can be found in `themes/bmeg/layouts/partials/`.
The header for the MDL based template is `themes/bmeg/layouts/partials/header.html` with the footer file `themes/bmeg/layouts/partials/footer.html`.

## Template parameters

- `title` : Name of the page
- `search` : enable the search dialog on the top of the page
- `javascript` : An array of Javascript files to be imported


## React Design
