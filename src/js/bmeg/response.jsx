import React,{Component} from 'react'
import {render} from 'react-dom'
import * as _ from 'underscore'
// import * as classNames from 'classnames'
import * as ReactFauxDOM from 'react-faux-dom'
import * as d3 from 'd3'
import {Ophion} from 'ophion'
import 'whatwg-fetch'

function addLists(a, b) {
  var longest = a.length > b.length ? a : b
  var shortest = a.length <= b.length ? a : b
  return longest.map(function(item, i) {
    return item + (shortest.length < i ? shortest[i] : 0.0)
  })
}

function sampleAverage(responses) {
  var inverse = 1.0 / responses.length
  var line = responses.reduce(function(average, curve) {
    // average.x = addLists(average.x, curve.x)
    average.y = addLists(average.y, curve.y)
    return average
  }, {x: responses[0].x, y: []})

  // line.y = line.y.map(function(m) {return m * inverse})
  return line
}


function value(x) {
  var v = null
  if (_.isString(x)) {
    v = {'s': x}
  } else if (_.isNumber(x)) {
    if (x === Math.floor(x)) {
      v = {'n': x}
    } else {
      v = {'r': x}
    }
  }

  return v ? v : x
}

var O = Ophion()




//////////////////////////////////////////////////////////////////////
///////////////// QUERIES
/////////////////////////////////////////////////////

var queries = {
  schema: function(callback) {
    fetch('/schema/protograph').then(function(response) {
      response.json().then(callback)
    })
  },

  firstVertex: function(label) {
    return function(callback) {
      O.query().has("gid", "type:" + label).outgoing("hasInstance").limit(1).execute(function(result) {
        console.log('firstVertex')
        console.log(result)
        callback(result[0])
      })
    }
  },

  variantTypeCounts: function(gene) {
    return function(callback) {
      // O.query().has("gid", "gene:" + gene).incoming("affectsGene").outgoing("termFor").groupCount("variant").execute(function(result) {
      O.query().has("gid", "gene:" + gene).inEdge("variantInGene").groupCount("term").execute(function(result) {        
        console.log('variantTypeCounts')
        console.log(result)
        callback(result[0])
      })
    }
  },

  mutationCounts: function(gene) {
    return function(callback) {
      // O.query().has("gid", "gene:" + gene).incoming("affectsGene").incoming("transcriptEffectOf").outgoing("annotationFor").outgoing("inCallSet").outgoing("callsFor").outgoing("diseaseOf").groupCount("term").execute(function(result) {
      O.query().has("gid", "gene:" + gene).incoming("variantInGene").outgoing("variantInBiosample").outgoing("termForDisease").groupCount("term").execute(function(result) {        
        console.log('mutationCounts')
        console.log(result)
        callback(result[0])
      })
    }
  },

  geneExists: function(gene, callback) {
    O.query().has("gid", "gene:" + gene).execute(function(result) {
      console.log('geneExists')
      console.log(result)
      callback(!_.isEmpty(result[0]))
    })
  },

  cohortCompounds: function(cohort) {
    return function(callback) {
      O.query().has("gid", "type:Compound").outgoing("hasInstance").values(["gid"]).execute(function(result) {
        console.log('cohortCompounds')
        console.log(result)
        callback(result)
      })
    }
  },

  cohortGids: function(cohort) {
    return function(callback) {
      O.query().has("gid", "cohort:" + cohort).outgoing("hasSample").values(["gid"]).execute(function(result) {
        console.log('cohortGids')
        console.log(result)
        callback(result)
      })
    }
  },

  samplesWithMutations: function(cohort, gene) {
    return function(callback) {
      O.query().has("gid", "gene:" + gene).incoming("variantInGene").outgoing("variantInBiosample").dedup().mark("a").incoming("hasSample").has("gid", "cohort:" + cohort).select(["a"]).values(["gid"]).execute(function(result) {
        console.log('samplesWithMutations')
        console.log(result)
        callback(result)
      })
    }
  },

  sampleResponses: function(samples, drug) {
    return function(callback) {
      console.log(samples)
      console.log(_.map(samples, value))
      O.query().has("gid", 'compound:' + drug).inEdge("responseToCompound").mark('a').outVertex().has("gid", O.within(samples)).select(['a']).values(['responseSummary', 'responseValues']).execute(function(result) {
        console.log('sampleResponses')
        console.log(result)
        callback(result)
      })
    }
  },

  cnaCallsByGene: function(cohort, gene) {
    return function(callback) {
      O.query().has("gid", "cohort:" + cohort).outgoing("hasMember").incoming("cnaCallsFor").incoming("inCNACallSet").outgoing("calledInGene").execute()
      // group by gene symbol, average cna value
      console.log('cnaCallsByGene')
      console.log(result)
      callback(result)
    }
  }
}

class GeneInput extends Component {
  componentDidMount(){
    // mdlCleanUp()
    componentHandler.upgradeElement(this.refs.mdlWrapper)
  }

  componentDidUpdate(){
    // mdlCleanUp()
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
    var self = this
    this.fetchCompounds(function(drugs) {
      var plain = drugs.map(function(drug) {return drug.slice(9)}).sort()
      self.setState({drugs: plain, loaded: true, selected: plain[0]})
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
      self.setState({samples: samples})
    })
  }

  selectDrug(drug) {
    console.log('set drug to ' + drug)
    this.setState({drug: drug})
    this.setGene(this.state.input)
  }

  extractResponses(responses) {
    var rawSummary = responses.filter(function(x, i) {return (i % 2) === 0})
    var rawValues = responses.filter(function(x, i) {return (i % 2) === 1})

    var summary = rawSummary.map(function(mutant) {
      console.log(mutant)
      var response = JSON.parse(mutant)
      var amax = response.filter(function(r) {return r['type'] === 'AUC'}) // 'EC50'}) // 'AMAX'})
      if (!_.isEmpty(amax)) {
        return amax[0]['value']
      }
    })

    console.log('values')
    console.log(rawValues[0])

    var values = rawValues.map(function(mutant) {
      var response = JSON.parse(mutant)
      return response.reduce(function(dimensions, point) {
        dimensions.x.push(Math.log(point.dose))
        dimensions.y.push(point.response)
        return dimensions
      }, {x: [], y: []})
    })

    return {
      summary: summary,
      values: values
    }
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

          var drug = self.state.drug // self.refs.drugselect.state.selected
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
                  [{name: 'normal samples', y: normalResponses.summary, type: 'box'},
                   {name: 'mutation samples', y: mutantResponses.summary, type: 'box'}]
                )

                var normalAverage = sampleAverage(normalResponses.values)
                normalAverage.mode = 'line'
                normalAverage.name = 'Normals'
                var mutantAverage = sampleAverage(mutantResponses.values)
                mutantAverage.mode = 'line'
                mutantAverage.name = 'Mutations'

                // var normalCurves = normalResponses.values.map(function(curve) {
                //   curve.name = "Normal"
                //   curve.mode = "lines"
                //   return curve
                // })

                // var mutantCurves = mutantResponses.values.map(function(curve) {
                //   curve.name = "Mutation"
                //   curve.mode = "lines"
                //   return curve
                // })

                Plotly.newPlot(
                  'curves-plot',
                  [normalAverage, mutantAverage]
                  // mutantCurves.concat(normalCurves)
                )
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
        <span className="informative-header">Drug response for samples with a given mutation vs those without that mutation</span>
        <GeneInput value={this.state.input} onChange={this.setGene.bind(this)} />
        <DrugSelect ref="drugselect" cohort={this.props.cohort} selectDrug={this.selectDrug.bind(this)} />
        <div id="response-plot"></div>
        <div id="curves-plot"></div>
        </div>
    )
  }
}

window.onload = function() {
  render(<DrugResponse cohort={"CCLE"} />, document.getElementById('drug-response'))
}

