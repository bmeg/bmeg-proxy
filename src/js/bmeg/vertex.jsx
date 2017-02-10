import React from 'react';
import {render} from 'react-dom';

import {PieChart,VertexViewer,foo} from 'ceto';
import {Ophion} from 'ophion';

var PubmedLink = function(props) {
  var url = "https://www.ncbi.nlm.nih.gov/pubmed/" + props.id;
  return (<div><a href={url} target="_blank">{url}</a></div>)
}

var queries = {
  variantTypeCounts: function(gene) {
    return function(callback) {
      Ophion().query().has("gid", ["gene:" + gene]).incoming("inGene").groupCount("variantClassification").by("variantClassification").cap(["variantClassification"]).execute(function(result) {
        callback(result['result'][0])
      })
    }
  },

  mutationCounts: function(gene) {
    return function(callback) {
      Ophion().query().has("gid", ["gene:" + gene]).incoming("inGene").outgoing("effectOf").outgoing("tumorSample").outgoing("sampleOf").has("tumorSite", []).groupCount("tumorSite").by("tumorSite").cap(["tumorSite"]).execute(function(result) {
        callback(result['result'][0])
      })
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

window.onload = function() {
  console.log(document.getElementById('vertex-explore'));
  render(<VertexViewer visualizations={generateVisualizations()} />, document.getElementById('vertex-explore'));
};
















  // setVertex(gid, nopushstate) {
  //   if (!gid) {
  //     this.setState({vertex: {}, error: ""})
  //   } else {
  //     var url = "/gaia/vertex/find/" + gid;
  //     this.setState({input: gid, loading: true, error: ""});
  //     $.ajax({
  //       url: url,
  //       dataType: 'json',
  //       type: 'GET',
  //       success: result => {
  //         if (Object.keys(result).length > 0) {
  //           this.setState({vertex: result, loading: false, error: ""})
  //           if (!nopushstate) {
  //             // Only push state to history if we found an actual vertex
  //             // This avoids pushing state for intermediate queries.
  //             history.pushState({gid: gid}, "Vertex: " + gid, '?gid=' + gid);
  //           }
  //         } else {
  //           this.setState({vertex: {}, loading: false, error: ""})
  //         }
  //       },
  //       error: (xhr, status, err) => {
  //         this.setState({loading: false, error: err.toString()})
  //         console.error(url, status, err.toString())
  //       },
  //       timeout: 60000,
  //     });
  //   }
  // },

  // render: function() {
  //   var loading = "";
  //   if (this.state.loading) {
  //     loading = <img src="/static/ripple.gif" width="50px" />
  //   }

  //   var error;
  //   if (this.state.error) {
  //     error = <div>Request error: {this.state.error}</div>
  //   }

  //   var emptyMessage = "";
  //   if (this.state.input) {
  //     emptyMessage = "No vertex found";
  //   }

  //   var vertex = <div className="empty-vertex">{emptyMessage}</div>;
  //   var visualizations = [];

  //   // The vertex isn't empty, so create a VertexView
  //   if (this.state.vertex.properties) {
  //     vertex = (<div><PropertiesView vertex={this.state.vertex} /><EdgesView vertex={this.state.vertex} navigate={this.setVertex} /></div>)

  //     if (this.state.vertex.properties.type === 'Pubmed') {
  //       var link = (<PubmedLink key="pubmed-link" id={this.state.vertex.properties.pmid} />)
  //       visualizations.push(link);
  //     }

  //     if (this.state.vertex.properties.type === 'Gene') {
  //       var gene = this.state.vertex.properties.symbol;
  //       var variantTypePie = <PieChart query={queries.variantTypeCounts(gene)} key='variant-type-pie' />
  //       var mutationPie = <PieChart query={queries.mutationCounts(gene)} key='mutations-pie' />

  //       visualizations.push(variantTypePie)
  //       visualizations.push(mutationPie)
  //     }
//   }

