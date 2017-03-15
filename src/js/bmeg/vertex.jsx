import React,{Component} from 'react';
import {render} from 'react-dom';
import * as _ from 'underscore';
// import * as classNames from 'classnames';
import cytoscape from 'cytoscape';
import * as ReactFauxDOM from 'react-faux-dom';
import * as d3 from 'd3';
import {Ophion} from 'ophion';

// import {PieChart,VertexViewer,SchemaGraph,foo} from 'ceto';
// import {PieChart} from 'ceto';

var hasOwn = {}.hasOwnProperty;

function classNames () {
	var classes = [];

	for (var i = 0; i < arguments.length; i++) {
		var arg = arguments[i];
		if (!arg) continue;

		var argType = typeof arg;

		if (argType === 'string' || argType === 'number') {
			classes.push(arg);
		} else if (Array.isArray(arg)) {
			classes.push(classNames.apply(null, arg));
		} else if (argType === 'object') {
			for (var key in arg) {
				if (hasOwn.call(arg, key) && arg[key]) {
					classes.push(key);
				}
			}
		}
	}

	return classes.join(' ');
}

var PubmedLink = function(props) {
  var url = "https://www.ncbi.nlm.nih.gov/pubmed/" + props.id;
  return (<div><a href={url} target="_blank">{url}</a></div>)
}

var queries = {
  schema: function(callback) {
    fetch('/gaia/schema/protograph').then(function(response) {
      response.json().then(callback);
    });
  },

  firstVertex: function(label) {
    return function(callback) {
      Ophion().query().label(label).limit(1).execute(function(result) {
        console.log(result);
        callback(result.result[0]);
      });
    }
  },

  variantTypeCounts: function(gene) {
    return function(callback) {
      Ophion().query().has("gid", ["gene:" + gene]).incoming("affectsGene").outgoing("termFor").groupCount("variant").by("term").cap(["variant"]).execute(function(result) {
        console.log(result);
        callback(result.result[0]);
      })
    }
  },

  mutationCounts: function(gene) {
    return function(callback) {
      Ophion().query().has("gid", ["gene:" + gene]).incoming("affectsGene").incoming("transcriptEffectOf").outgoing("annotationFor").outgoing("inCallSet").outgoing("callsFor").outgoing("diseaseOf").groupCount("term").by("term").cap(["term"]).execute(function(result) {
        console.log(result);
        callback(result.result[0]);
      });
    }
  },

  geneExists: function(gene, callback) {
    Ophion().query().has("gid", ["gene:" + gene]).execute(function(result) {
      console.log(result);
      callback(!_.isEmpty(result.result));
    });
  },

  cohortCompounds: function(cohort) {
    return function(callback) {
      Ophion().query().has("gid", ["type:Compound"]).outgoing("hasInstance").values(["gid"]).execute(function(result) {
      // Ophion().query().has("gid", ["cohort:" + cohort]).outgoing("hasMember").incoming("responseOf").outgoing("responseTo").dedup().values(["gid"]).execute(function(result) {
        
        console.log(result);
        callback(result.result);
      })
    }
  },

  cohortGids: function(cohort) {
    return function(callback) {
      Ophion().query().has("gid", ["cohort:" + cohort]).outgoing("hasMember").mark("a").incoming("callsFor").select(["a"]).values(["gid"]).execute(function(result) {
        console.log(result);
        callback(result.result);
      });
    }
  },

  samplesWithMutations: function(cohort, gene) {
    return function(callback) {
      Ophion().query().has("gid", ["gene:" + gene] ).incoming("affectsGene").incoming("transcriptEffectOf").outgoing("annotationFor").outgoing("inCallSet").outgoing("callsFor").mark("a").incoming("hasMember").has("gid", ["cohort:" + cohort]).select(["a"]).values(["gid"]).execute(function(result) {
        console.log(result);
        callback(result.result);
      });
    }
  },

  sampleResponses: function(samples, drug) {
    return function(callback) {
      Ophion().query().has("gid", ['compound:' + drug]).incoming("responseTo").mark('a').outgoing('responseOf').has("gid", samples).select(['a']).values(['responseSummary']).execute(function(result) {
        console.log(result);
        callback(result.result);
      });
    }
  }
}

function generateVisualizations() {
  function variantTypePie(vertex) {
    return <PieChart query={queries.variantTypeCounts(vertex.properties.symbol)} key='variant-type-pie' />;
  }

  function mutationPie(vertex) {
    return <PieChart query={queries.mutationCounts(vertex.properties.symbol)} key='mutations-pie' />;
  }

  function pubmedLink(vertex) {
    return <PubmedLink key="pubmed-link" id={vertex.properties.pmid} />;
  }

  function drugResponse(vertex) {
    return <DrugResponse key="drug-response" cohort={vertex.properties.name} />
  }

  return {
    'Gene': [variantTypePie, mutationPie],
    'Pubmed': [pubmedLink],
    'Cohort': [drugResponse]
  }
}













////////////////////////////////////////////////
////////////// PIE CHART
///////////////////////////////////////////

var nonalpha = /[^a-zA-Z]/g
var keyify = function(s) {
  return s.split(nonalpha).join('')
}

var PieChart = React.createClass({
  getInitialState: function() {
    var pie = <div><img src='/static/ripple.gif' /></div>
    return {pie: pie}
  },
  
  buildPie: function(data) {
    var cohort = Object.keys(data).map(function(key) {
      return {"title": key, "value": data[key]};
    })

    cohort.sort(function(a, b) {
      return a.value < b.value ? 1 : a.value > b.value ? -1 : 0;
    })

    var el = ReactFauxDOM.createElement('svg');
    el.setAttribute('width', 800);
    el.setAttribute('height', 300);
    
    var pie = d3.pie().value(function(d) {return d.value});
    var slices = pie(cohort);
    var arc = d3.arc().innerRadius(0).outerRadius(100);
    var color = d3.scaleOrdinal(d3.schemeCategory20b);

    var svg = d3.select(el);
    var g = svg.append('g').attr('transform', 'translate(300, 100)');
    
    g.selectAll('path.piechart')
      .data(slices, function(d) {return d.data.title})
      .enter()
      .append('path')
      .attr('class', function(d) {return 'slice ' + keyify(d.data.title)})
      .attr('d', arc)
      .attr('fill', function(d) {return color(d.data.title)});
    
    svg.append('g')
      .attr('class', 'legend')
      .selectAll('text')
      .data(slices, function(d) {return d.data.title})
      .enter()
      .append('text')
      .text(function(d) { return '- ' + d.data.title; })
      .attr('fill', function(d) { return color(d.data.title); })
      .attr('y', function(d, i) { return 20 * (i + 1); })
      .on("mouseover", function(dOver, i) { 
        console.log("mouseover " + keyify(dOver.data.title))
        var key = keyify(dOver.data.title)
        d3.selectAll('.slice.' + key)
          .attr('fill', 'white')
      })
      .on("mouseout", function(dOut, i) { 
        console.log("mouseout " + keyify(dOut.data.title))
        var key = keyify(dOut.data.title)
        d3.selectAll('.slice.' + key)
          .data([dOut])
          .attr('fill', color(dOut.data.title))
      })

    return el.toReact();
  },

  componentDidMount: function() {
    var we = this;
    if (this.props.data) {
      this.setState({pie: this.buildPie(this.props.data)});
    } else if (this.props.query) {
      this.props.query(function(results) {
        we.setState({pie: we.buildPie(results)});
      }.bind(this));
    }
  },
  
  render: function() {
    return (
      <div>{this.state.pie}</div>
    )
  }
})







/////////////////////////////////////////////////////////
/////////////// DRUG RESPONSE
////////////////////////////////////////////////

class GeneInput extends Component {
  componentDidMount() {
    componentHandler.upgradeElement(this.refs.mdlWrapper)
  }

  render() {
    return <div
      className="mdl-textfield mdl-js-textfield mdl-textfield--floating-label"
      ref="mdlWrapper"
    >
      <label
        className="mdl-textfield__label"
        htmlFor="vertex-gid-input"
      >Enter a gene name</label>
      <input
        id="gene-response-input"
        type="text"
        name="gene"
        className="mdl-textfield__input"
        onChange={e => this.props.onChange(e.target.value)}
        value={this.props.value}
      />
    </div>
  }
}

class DrugSelect extends Component {
  constructor(props) {
    super(props)
    this.fetchCompounds = queries.cohortCompounds(props.cohort)
    this.state = {
      drugs: [],
      selected: "",
      loaded: false
    }
  }

  componentDidMount() {
    console.log(this.props)
    var self = this;
    this.fetchCompounds(function(drugs) {
      var plain = drugs.map(function(drug) {return drug.slice(9)})
      console.log(plain)
      self.setState({drugs: plain, loaded: true, selected: plain[0]});
      self.props.selectDrug(plain[0])
    })
  }

  selectDrug(event) {
    var drug = event.target.value
    this.setState({selected: drug})
    this.props.selectDrug(drug)
  }

  render() {
    if (this.state.loaded) {
      var drugOptions = this.state.drugs.map(function(drug) {
        return <option value={drug} key={drug}>{drug}</option>
      })

      return (
          <div>
            <label className="label-block">Then choose a drug</label>
            <select value={this.state.selected} onChange={this.selectDrug.bind(this)}>
              {drugOptions}
            </select>
          </div>
      )
    } else {
      return <div>loading compounds....</div>
    }
  }
}

class DrugResponse extends Component {
  constructor(props) {
    super(props)
    this.fetchSamples = queries.cohortGids(props.cohort)
    this.state = {
      loaded: false,
      samples: [],
      mutants: [],
      normals: [],
      mutantResponses: [],
      normalResponses: [],
      drug: "",
      input: ""
    }
  }

  componentDidMount() {
    var self = this
    this.fetchSamples(function(samples) {
      console.log(samples)
      self.setState({samples: samples})
    })
  }

  selectDrug(drug) {
    console.log('set drug to ' + drug)
    this.setState({drug: drug})
    this.setGene(this.state.input)
  }

  extractResponses(responses) {
    return responses.map(function(mutant) {
      var response = JSON.parse(mutant)
      var amax = response.filter(function(r) {return r['type'] === 'AUC'}) // 'EC50'}) // 'AMAX'})
      if (!_.isEmpty(amax)) {
        return amax[0]['value']
      }
    })// .filter(function(x) {return x && x > -100 && x < 100});
  }

  setGene(gene) {
    console.log(gene)
    var self = this
    self.setState({input: gene})
    queries.geneExists(gene, function(exists) {
      if (exists) {
        var fetchMutants = queries.samplesWithMutations(self.props.cohort, gene)
        fetchMutants(function(mutants) {
          var normals = _.difference(self.state.samples, mutants)
          self.setState({mutants: mutants, normals: normals})
          console.log("mutants: " + mutants.length)
          console.log("normals: " + normals.length)

          var drug = self.state.drug; // self.refs.drugselect.state.selected
          var fetchMutantResponses = queries.sampleResponses(mutants, drug)
          var fetchNormalResponses = queries.sampleResponses(normals, drug)

          if (!_.isEmpty(mutants)) {
            fetchMutantResponses(function(mresponses) {
              console.log(mresponses)
              fetchNormalResponses(function(nresponses) {
                console.log(nresponses)
                var mutantResponses = self.extractResponses(mresponses)
                var normalResponses = self.extractResponses(nresponses)
                console.log(mutantResponses)
                console.log(normalResponses)
                self.setState({mutantResponses: mutantResponses, normalResponses: normalResponses})
                Plotly.newPlot(
                  'response-plot',
                  [{name: 'mutation samples', y: mutantResponses, type: 'box'},
                   {name: 'normal samples', y: normalResponses, type: 'box'}])
              })
            })
          }
        })
      } else {
        self.setState({mutants: [], normals: []})
      }
    })
  }

  render() {
    return (
      <div>
        <span className="informative-header">Visualize drug responses for samples containing a mutation in the given gene</span>
        <GeneInput value={this.state.input} onChange={this.setGene.bind(this)} />
        <DrugSelect ref="drugselect" cohort={this.props.cohort} selectDrug={this.selectDrug.bind(this)} />
        <div id="response-plot"></div>
      </div>
    )
  }
}



















/////////////////////////////////////////
///// VERTEX VIEWER
//////////////////////////////

var snipPrefix = function(s) {
  return s.substring(s.indexOf(':') + 1);
}

function getParameterByName(name, url) {
  if (!url) {
    url = window.location.href;
  }
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
  results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

var VertexEdges = React.createClass({
  getInitialState: function() {
    return {};
  },

  render: function() {
    var props = this.props;
    var prefix = props.edges[0].split(':')[0]
    var header = <span>{props.label + ' '}<span className="edge-direction">({props.direction} {prefix})</span></span>

    var items = props.edges.map(gid => (
      <ExpandoItem key={gid}>
        <a onClick={() => props.navigate(gid)}>{snipPrefix(gid)}</a>
      </ExpandoItem>
    ));

    return <Expando header={header}>{items}</Expando>;
  }
});

function PropertyRow(props) {
  var value = props.value
  if (_.isArray(value)) {
    value = JSON.stringify(value)
  } else if (_.isObject(value)) {
    value = JSON.stringify(value)
  }

  return (<tr>
    <td className="prop-key mdl-data-table__cell--non-numeric">{props.name}</td>
    <td className="mdl-data-table__cell--non-numeric">{value}</td>
  </tr>)
}

var PropertiesView = function(props) {
  var properties = Object.keys(props.vertex.properties).map(function(key) {
    var v = props.vertex.properties[key];
    return <PropertyRow key={key} name={key} value={v} />
  });

  return (
    <div>
      <div className="vertex-properties">
        <table
          className="prop-table mdl-data-table mdl-js-data-table mdl-data-table--selectable mdl-shad--2dp"
        ><tbody>
          {properties}
        </tbody></table>
      </div>
    </div>
  )
}

var EdgesView = function(props) {
  console.log(props)
  var inEdges = Object.keys(props.vertex['in'])
  // Filter out edges with "hasInstance" in label
  .filter(key => key != 'hasInstance')
  .map(function(key) {
    return <VertexEdges
      key={key}
      label={key}
      navigate={props.navigate}
      edges={props.vertex['in'][key]}
      direction="from"
    />
  });
   var outEdges = Object.keys(props.vertex['out'])
  // Filter out edges with "hasInstance" in label
  .filter(key => key != 'hasInstance')
  .map(function(key) {
    return <VertexEdges
      key={key}
      label={key}
      navigate={props.navigate}
      edges={props.vertex['out'][key]}
      direction="to"
    />
  });

  return (
    <div>
      <div className="vertex-edges-wrapper">
        <div className="vertex-in-edges vertex-edges">
          <h4>In Edges</h4>
          {inEdges}
        </div>
        <div className="vertex-out-edges vertex-edges">
          <h4>Out Edges</h4>
          {outEdges}
        </div>
      </div>
    </div>
  )
}

var VertexInput = React.createClass({
  componentDidMount() {
    componentHandler.upgradeElement(this.refs.mdlWrapper)
  },
  render() {
    return <div
      className="mdl-textfield mdl-js-textfield mdl-textfield--floating-label"
      ref="mdlWrapper"
    >
      <label
        className="mdl-textfield__label"
        htmlFor="vertex-gid-input"
      >Enter a vertex GID</label>
      <input
        id="vertex-gid-input"
        type="text"
        name="gid"
        className="mdl-textfield__input"
        onChange={e => this.props.onChange(e.target.value)}
        value={this.props.value}
      />
    </div>
  },
})

var Expando = React.createClass({
  getInitialState() {
    return {
      collapsed: true,
    }
  },
  componentDidMount() {
    var content = document.getElementById(this.refs.content);
    if (content) {
      content.css('margin-top', -content.height());
    }
  },
  onClick() {
    this.setState({collapsed: !this.state.collapsed})
  },
  render() {
    var props = this.props;
    var rootClassName = classNames("expando", "mdl-collapse", "mdl-navigation", {
      "mdl-collapse--opened": !this.state.collapsed,
    })
    
    return (<div className={rootClassName}>
      <a className="mdl-navigation__link mdl-collapse__button expando-header" onClick={this.onClick}>
        <i className="material-icons mdl-collapse__icon mdl-animation--default">expand_more</i>
        {props.header}
      </a>
      <div className="mdl-collapse__content-wrapper expando-content">
        <div className="mdl-collapse__content mdl-animation--default" ref="content">
          {props.children}
        </div>
      </div>
    </div>)
  }
})

function ExpandoItem(props) {
  return <span className="mdl-navigation__link">{props.children}</span>
}

function extractLabel(label) {
  var front = label.split(':')[0];
  return front.charAt(0).toUpperCase() + front.slice(1);
}

function fetchVertex(gid, callback) {
  fetch("/gaia/vertex/find/" + gid).then(function(response) {return response.json()}).then(callback);
}

var VertexViewer = React.createClass({
  getInitialState() {
    return {
      input: this.getGIDFromURL(),
      loading: false,
      error: "",
      vertex: {},
    };
  },

  getGIDFromURL() {
    return getParameterByName("gid") || "";
  },

  componentDidMount() {
    window.onpopstate = this.onPopState
    var gid = this.props.input
    if (gid) {
    // if (this.state.input) {
      this.setVertex(gid, true)
      history.pushState({gid: gid}, "Vertex: " + gid, '?gid=' + gid)
    }
  },

  onPopState(e) {
    var hash = this.getGIDFromURL();
    if (e.state && e.state.gid) {
      this.setVertex(e.state.gid, true)
    } else if (hash) {
      this.setVertex(hash, true)
    } else {
      this.setVertex()
    }
  },

  setVertex(gid, nopushstate) {
    if (!gid) {
      this.setState({vertex: {}, error: "", input: ""})
    } else {
      var we = this;
      this.setState({input: gid, loading: true, error: ""});
      fetchVertex(gid, function(result) {
        if (Object.keys(result).length > 0) {
          // we.setState({input: gid, vertex: result, loading: false, error: ""})
          we.setState({vertex: result, loading: false, error: ""})
          if (!nopushstate) {
            history.pushState({gid: gid}, "Vertex: " + gid, '?gid=' + gid);
          }
        } else {
          we.setState({vertex: {}, loading: false, error: ""})
        }
      });
    }
  },

  render: function() {
    var loading = "";
    var we = this;
    if (this.state.loading) {
      loading = <img src="/static/ripple.gif" width="50px" />
    }

    var error;
    if (this.state.error) {
      error = <div>Request error: {this.state.error}</div>
    }

    var emptyMessage = "";
    if (this.state.input) {
      emptyMessage = "No vertex found";
    }

    var spacing = <div key="spacing" className="spacing"></div>

    var properties = <div className="empty-vertex">{emptyMessage}</div>;
    var visualizations = [];

    if (this.state.vertex.properties) {
      properties = (<div><PropertiesView vertex={this.state.vertex} /><EdgesView vertex={this.state.vertex} navigate={this.setVertex} /></div>)

      if (this.props.visualizations) {
        var label = this.state.vertex.type || this.state.vertex.properties.label || this.state.vertex.properties['#label'] || this.state.vertex.properties.type || extractLabel(this.state.vertex.properties.gid);
        console.log("label: " + label)
        if (this.props.visualizations[label]) {
          console.log("visualizations found: " + this.props.visualizations[label].length)
          visualizations = visualizations.concat(this.props.visualizations[label].map(function(visualization) {
            return visualization(we.state.vertex)
          }));
        }
      }
    }

    console.log("generated: " + visualizations.length);

    return (
      <div>
        <VertexInput onChange={this.setVertex} value={this.state.input} />
        {loading}
        {visualizations}
        {error}
        {spacing}
        {properties}
      </div>
    );
  }
});



































/////////////////////////////////////////
///// SCHEMA
//////////////////////////////

function schemaToCytoscape(schema) {
  if (_.isEmpty(schema)) {
    return {nodes: [], edges: []};
  } else {
    console.log(schema)
    var nodes = Object.keys(schema['vertexes']).map(function(key) {
      var vertex = schema['vertexes'][key]
      return {data: {id: vertex.gid, name: vertex.label}};
    });
    
    var edges = _.flatten(Object.keys(schema['in']).map(function(key) {
      return schema['in'][key].map(function(edge) {
        return {data: {source: edge['in'], target: edge['out'], label: edge['label']}};
      });
    }));

    return {
      nodes: nodes,
      edges: edges
    }
  }
}

class SchemaGraph extends Component {
  constructor(props){
    super(props);
    this.renderCytoscape = this.renderCytoscape.bind(this);
  }

  renderCytoscape() {
    console.log('rendering schema');
    var nodeColor = '#594346';
    var nodeText = '#ffffff';
    var edgeColor = '#f22f08';
    var edgeText = '#ffffff';

    var cyelement = this.refs.cytoscape;
    this.cy = cytoscape({
      container: cyelement,
      // container: document.getElementById('cy'),
      boxSelectionEnabled: false,
      autounselectify: true,

      style: cytoscape.stylesheet()
        .selector('node')
        .css({
          'content': 'data(name)',
          'height': 80,
          'width': 80,
          'background-fit': 'cover',
          'background-color': nodeColor,
          // 'border-color': '#000',
          // 'border-width': 3,
          // 'border-opacity': 0.5,
          // 'shape': 'roundrectangle',
          'color': nodeText,
          'font-family': '"Lucida Sans Unicode", "Lucida Grande", sans-serif',
          'font-size': 24,
          'text-outline-color': nodeColor,
          'text-outline-width': 3,
          'text-valign': 'center'
        })

        .selector('edge')
        .css({
          'content': 'data(label)',
          'width': 6,
          'edge-text-rotation': 'autorotate',
          'target-arrow-shape': 'triangle',
          'line-color': edgeColor,
          'target-arrow-color': edgeColor,
          'curve-style': 'bezier',
          'color': edgeText,
          'font-size': 18,
          'text-outline-color': edgeColor,
          'text-outline-width': 2,
        }),

      elements: schemaToCytoscape(this.props.schema)
    });

    this.layout = this.cy.makeLayout({
      name: 'cose' // ,
      // animate: true,
      // padding: 30,
      // animationThreshold: 250,
      // refresh: 20
    });
  }

  componentDidMount() {
    this.renderCytoscape();
    this.runLayout();
  }

  shouldComponentUpdate() {
    return false;
  }  

  componentWillReceiveProps(props) {
    var next = schemaToCytoscape(props.schema);
    this.cy.json(next);
    this.renderCytoscape();
    this.runLayout()
  }

  componentWillUnmount() {
    this.cy.destroy();
  }

  runLayout() {
    this.layout.run()
  }

  cytoscape() {
    return this.cy;
  }

  render(){
    let containerStyle = {
      height: this.props.height || '1000px',
      width: this.props.width || '1000px'
    }

    return(
      <div>
        <div id="cy" style={containerStyle} ref="cytoscape" />
      </div>
    )
  }
}






function urlParams() {
  var params = {};
  var match,
      pl     = /\+/g,  // Regex for replacing addition symbol with a space
      search = /([^&=]+)=?([^&]*)/g,
      decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
      query  = window.location.search.substring(1);

  while (match = search.exec(query)) {
    console.log("match found " + match[1] + "," + match[2])
    params[decode(match[1])] = decode(match[2]);
  }

  return params;
}





















/////////////////////////////////////////
///// SCHEMA VIEWER
//////////////////////////////

class SchemaViewer extends Component {
  constructor(props) {
    super(props)
    self = this;
    this.state = {
      schema: {},
      loaded: false,
      gid: null,
      label: null
    }

    this.events = {
      tap: function(cy) {
        var label = this.id()
        console.log(label);
        var query = queries.firstVertex(label);
        query(function(result) {
          console.log(result)
          self.setState({schema: self.state.schema, label: label.toLowerCase(), gid: result.properties.gid});
        })
      }
    }
  }

  componentDidMount() {
    console.log('mounting')

    var params = urlParams()
    console.log(params)
    if (_.isEmpty(params)) {
      console.log('params is empty')
      var self = this;
      queries.schema(function(schema) {
        self.setState({schema: schema, loaded: true})
        self.refs.schema.cytoscape().on('tap', 'node', self.events.tap);
      });
    } else if (params['gid']) {
      console.log('params has gid: ' + params['gid'])
      this.setState({gid: params['gid']})
    }
  }

  render() {
    var elements = []
    if (this.state.gid) {
      var vertex = <VertexViewer key="vertex" label={this.state.label} input={this.state.gid} visualizations={generateVisualizations()} />
      elements.push(vertex);
    } else if (this.state.loaded) {
      var schema = <SchemaGraph key="schema" ref="schema" width={this.props.width} height={this.props.height} schema={this.state.schema} />
      elements.push(schema)
    } else {
      elements.push(<div key="loading">loading....</div>)
    }
    return (
      <div>
        {elements}
      </div>
    )
  }
}

function viewer(router) {
  render(<VertexViewer visualizations={generateVisualizations()} />, document.getElementById('vertex-explore'));
}

function schema(router) {
  var width = 800;
  var height = 800;
  queries.schema(function(schema) {
    render(<SchemaGraph schema={schema} width={width} height={height} />, document.getElementById('vertex-explore'));
  });
}

function schemaViewer(router) {
  var width = 800;
  var height = 800;
  render(<SchemaViewer width={width} height={height} schema={schema} />, document.getElementById('vertex-explore'));
}

function drugResponse(router) {
  var drugs = ["yellow", "green", "cerise", "blue"]
  render(<DrugResponse cohort={"CCLE"} />, document.getElementById('vertex-explore'))
}

function initialize() {
  // var router = new Navigo(null, false);

  // router
  //   .on('/vertex/:gid', function(params) {
  //     console.log(params.gid);
  //   })
  //   .on(function() {
  //     schemaViewer()
  //   }).resolve()

  console.log(document.getElementById('vertex-explore'));
  schemaViewer()
  // drugResponse()
}

window.onload = function() { initialize() };

export {
  queries
}
