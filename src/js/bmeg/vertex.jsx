import React,{Component} from 'react';
import {render} from 'react-dom';
import * as Navigo from 'navigo';
import * as _ from 'underscore';
import cytoscape from 'cytoscape';

// import {PieChart,VertexViewer,SchemaGraph,foo} from 'ceto';
import {PieChart} from 'ceto';
import {Ophion} from 'ophion';

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

  cohortCompounds: function(cohort) {
    return function(callback) {
      Ophion().query().has("gid", ["cohort:" + cohort]).outgoing("hasMember").incoming("responseOf").outgoing("responseTo").dedup().values(["gid"]).execute(function(result) {
        console.log(result);
        callback(result.result[0]);
      })
    }
  },

  cohortGids: function(cohort) {
    return function(callback) {
      Ophion().query().has("gid", ["cohort:" + cohort]).outgoing("hasMember").mark("a").incoming("callsFor").select(["a"]).values(["gid"]).execute(function(result) {
        console.log(result);
        callback(result.result[0]);
      });
    }
  },

  samplesWithMutations: function(cohort, gene) {
    return function(callback) {
      Ophion().query().has("gid", ["gene:" + gene] ).incoming("affectsGene").incoming("transcriptEffectOf").outgoing("annotationFor").outgoing("inCallSet").outgoing("callsFor").mark("a").incoming("hasMember").has("gid", ["cohort:" + cohort]).select(["a"]).values(["gid"]).execute(function(result) {
        console.log(result);
        callback(result.result[0]);
      });
    }
  },

  sampleResponses: function(samples, drug) {
    return function(callback) {
      Ophion().query().has("gid", samples).incoming("responseOf").mark("a").outgoing("responseTo").has("gid", ['compound:' + drug]).select(["a"]).values(["gid", "responseSummary"]).execute(function(result) {
        console.log(result);
        callback(result.result[0]);
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

  return {
    'Gene': [variantTypePie, mutationPie],
    'Pubmed': [pubmedLink]
  }
}

// function drugResponseBoxPlot() {                
//   Ophion().query().has("gid", ["cohort:CCLE"]).outgoing("hasMember").incoming("responseOf").outgoing("responseTo").dedup().values(["gid"]).execute( 
//     function(x) {
//       console.log("Got " + Object.keys(x))
//       var sel = $("#myDrugs");
//       $.unique($(x['result'])).each(function() {
//         sel.append($("<option>").attr('value',this).text(this));
//       });
//     }
//   )
  
//   var all_samples = []
//   Ophion().query().has("gid", ["cohort:CCLE"]).outgoing("hasMember").mark("a").incoming("callsFor").select(["a"]).values(["gid"]).execute(
//     function(x) {
//       all_samples = $.unique(x['result'])
//     }
//   )
  
//   var mutant_samples = [];
//   var normal_samples = [];
//   var mutant_vals = [];
//   var normal_vals = [];
  
//   doUpdate = function() {
//     console.log( $("#myInput").val() + $("#myDrugs").val())
//     mutant_samples = [];
//     normal_samples = [];
//     mutant_vals = [];
//     normal_vals = [];
//     $("#myDiv").empty();
//     Ophion().query().has("gid", ["gene:" + $("#myInput").val()] ).incoming("affectsGene").
//       incoming("transcriptEffectOf").outgoing("annotationFor").
//       outgoing("inCallSet").outgoing("callsFor").mark("a").
//       incoming("hasMember").has("gid", ["cohort:CCLE"]).
//       select(["a"]).values(["gid"]).execute(
//         function(x) {
//           mutant_samples = $.unique(x['result'])
//           if (mutant_samples.length > 0) {
//             console.log("Got mutants: " + mutant_samples)
//             normal_samples = all_samples.filter( function(x) { return mutant_samples.indexOf( x ) < 0; } )
//             doGetMutVals();
//           }
//         }
//       )
//   }
  
//   doGetMutVals = function() {
//     Ophion().query().has("gid", mutant_samples).incoming("responseOf").mark("a").outgoing("responseTo").
//       has("gid", [$("#myDrugs").val()] ).select(["a"]).values(["gid", "responseSummary"]).execute(
//         function(x) {
//           out = [];
//           for (var i = 1; i < x['result'].length; i += 2) {
//             var y = JSON.parse(x['result'][i]);
//             // var y = x['result'][i];
//             console.log(y);
//             var amax = y.filter(
//               function(x){
//                 return x['type'] == "AMAX"
//               })
//             if (amax[0]) {
//               out.push(amax[0]['value'])
//             }
//           }
//           mutant_vals = out;
//           doGetNormVals()
//         }
//       )
//   }
  
//   doGetNormVals = function() {
//     Ophion().query().has("gid", normal_samples).incoming("responseOf").mark("a").outgoing("responseTo").
//       has("gid", [$("#myDrugs").val()] ).select(["a"]).values(["gid", "responseSummary"]).execute(
//         function(x) {
//           out = [];
//           for (var i = 1; i < x['result'].length; i += 2) {
//             var y = JSON.parse(x['result'][i]);
//             // var y = x['result'][i];
//             var amax = y.filter(
//               function(x){
//                 return x['type'] == "AMAX"
//               })
//             if (amax[0]) {
//               out.push(amax[0]['value'])
//             }
//           }
//           normal_vals = out;
//           doDraw()
//         }
//       )
//   }
  
//   doDraw = function() {
//     var mutant = {
//       y: mutant_vals,
//       type: 'box'
//     };

//     var normal = {
//       y: normal_vals,
//       type: 'box'
//     };
//     var data = [mutant, normal];
//     Plotly.newPlot('myDiv', data);
//   }
  
//   $("#myInput").on('change keydown paste input', doUpdate);
//   $("#myDrugs").on('change keydown paste input', doUpdate);
// }


















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
    var header = props.label + " (" + props.direction + " " + prefix + ")";

    var items = props.edges.map(gid => (
      <ExpandoItem key={gid}>
        <a onClick={() => props.navigate(gid)}>{snipPrefix(gid)}</a>
      </ExpandoItem>
    ));

    return <Expando header={header}>{items}</Expando>;
  }
});

function PropertyRow(props) {
  return (<tr>
    <td className="prop-key mdl-data-table__cell--non-numeric">{props.name}</td>
    <td className="mdl-data-table__cell--non-numeric">{props.value}</td>
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
    // componentHandler.upgradeElement(this.refs.mdlWrapper)
  },
  render() {
    return <div
      className="mdl-textfield mdl-js-textfield mdl-textfield--floating-label"
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
    // return <div
    //   className="mdl-textfield mdl-js-textfield mdl-textfield--floating-label"
    //   ref="mdlWrapper"
    // >
    //   <label
    //     className="mdl-textfield__label"
    //     htmlFor="vertex-gid-input"
    //   >Enter a vertex GID</label>
    //   <input
    //     id="vertex-gid-input"
    //     type="text"
    //     name="gid"
    //     className="mdl-textfield__input"
    //     onChange={e => this.props.onChange(e.target.value)}
    //     value={this.props.value}
    //   />
    // </div>
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
        <div className="mdl-collapse__content mdl-animation--default">
          {props.children}
        </div>
      </div>
    </div>)
  }
})

//        <div className="mdl-collapse__content mdl-animation--default" ref="content">

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
    return getParameterByName("gid")
  },

  componentDidMount() {
    window.onpopstate = this.onPopState
    if (this.state.input) {
      this.setVertex(this.state.input, true)
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
      this.setState({vertex: {}, error: ""})
    } else {
      var we = this;
      this.setState({input: gid, loading: true, error: ""});
      fetchVertex(gid, function(result) {
        if (Object.keys(result).length > 0) {
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

    var properties = <div className="empty-vertex">{emptyMessage}</div>;
    var visualizations = [];

    if (this.state.vertex.properties) {
      properties = (<div><PropertiesView vertex={this.state.vertex} /><EdgesView vertex={this.state.vertex} navigate={this.setVertex} /></div>)

      if (this.props.visualizations) {
        var label = this.state.vertex.properties.label || this.state.vertex.properties['#label'] || this.state.vertex.properties.type || extractLabel(this.state.vertex.properties.gid);
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

class SchemaViewer extends Component {
  constructor(props) {
    super(props)
    this.state = {
      schema: {},
      loaded: false,
      label: null
    }

    this.events = {
      tap: function(cy) {
        console.log(this.id());
      }
    }
  }

  componentDidMount() {
    console.log('mouhnting')

    var self = this;
    queries.schema(function(schema) {
      self.setState({schema: schema, loaded: true})
      self.refs.schema.cytoscape().on('tap', 'node', self.events.tap);
      // self.refs.schema.cytoscape().on('tap', 'node', function(cy) {
      //   console.log(this.id())
      // });
    });
  }

  render() {
    if (this.state.label) {
      return (
          <VertexViewer label={this.state.label} visualizations={generateVisualizations()} />, document.getElementById('vertex-explore')
      )
    } else if (this.state.loaded) {
      return (
        <SchemaGraph ref="schema" width={this.props.width} height={this.props.height} schema={this.state.schema} />
      )
    } else {
      return <div>loading....</div>
    }
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

function initialize() {
  var router = new Navigo(null, false);

  router
    .on('/vertex/:gid', function(params) {
      console.log(params.gid);
    })
    .on(function() {
      schemaViewer()
    }).resolve()

  // render(<VertexViewer visualizations={generateVisualizations()} />, document.getElementById('vertex-explore'));
  // queries.schema(function(schema) {
  //   render(<SchemaGraph schema={schema} width={width} height={height} />, document.getElementById('vertex-explore'));
  // });

  console.log(document.getElementById('vertex-explore'));
}

window.onload = function() { initialize() };

export {
  queries
}
