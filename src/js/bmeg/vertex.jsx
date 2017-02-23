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

window.onload = function() {
  console.log(document.getElementById('vertex-explore'));
  render(<VertexViewer visualizations={generateVisualizations()} />, document.getElementById('vertex-explore'));
};

export {
  queries
}
