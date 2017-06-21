// required for all components
import React,{Component} from 'react'
import {render} from 'react-dom'

// required to query bmeg
import {Ophion} from 'ophion'

// use this instead of boilerplate
import * as _ from 'underscore'

class OphionColumn extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    let rows = _.map(this.props.items, function(row) {
      var unpre = row.gid.split(':').slice(1).join(':');
      return <div key={row.gid}>
        <a href={"/?gid=" + row.gid}>{unpre}</a>
      </div>
    });

    return <div>
      <h3>{this.props.label}</h3>
      {rows}
      </div>
  }
}

class OphionSearch extends Component {
  constructor(props) {
    super(props)
    this.state = {
      text: "",
      results: [],
      timeout: null
    }
    this.O = Ophion()
    this.debounceInterval = 500;
  }

  groupResults(results) {
    if (!results[0]) {
      return {}
    } else {
      return _.groupBy(results, function(r) {return r.label})
    }
  }

  doSearch(value) {
    var self = this;
    this.O.query().searchVertex(value).execute(function(results) {
      var groups = self.groupResults(results)
      console.log('results: ' + results.length)
      console.log('first result: ' + Object.keys(groups))

      self.setState({results: groups})
    })
  }

  handleChange(event) {
    if (this.state.timeout) {
      clearTimeout(this.state.timeout);
      this.setState({timeout: null});
    }

    var value = event.target.value;
    var self = this;
    var timeout = setTimeout(function() {self.doSearch(value)}, this.debounceInterval)
    this.setState({text: value, timeout: timeout})
  }

  render() {
    var self = this;
    let columns = Object.keys(this.state.results).map(function(label) {
      var column = self.state.results[label];
      return <OphionColumn key={label} label={label} items={column} />
    })

    return (
      <div>
      <div>
      <input className="mdl-textfield__input mdl-color--grey-100" type="text" onChange={this.handleChange.bind(this)} />
      </div>
      <div>
      {columns}
      </div>
      </div>
    )      
  }
}

// when page loads, render component
var previousonload = window.onload
window.onload = function() {
  previousonload()
  render(<OphionSearch name="All" filter="" />, document.getElementById('ophion-search'));
}
