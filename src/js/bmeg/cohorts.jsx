




// required for all components
import React,{Component} from 'react'
import {render} from 'react-dom'

// required to query bmeg
import {Ophion} from 'ophion'

// use this instead of boilerplate
import * as _ from 'underscore'

// toolbox components
import {Button, IconButton} from 'react-toolbox/lib/button';
import Tooltip from 'react-toolbox/lib/tooltip';
import Avatar from 'react-toolbox/lib/avatar';
import Chip from 'react-toolbox/lib/chip';
import Dialog from 'react-toolbox/lib/dialog';


import OphionTable from './ophion-table.jsx';
import OphionSidebar from './ophion-sidebar.jsx';

// tooltip versions
const TooltipButton = Tooltip(Button);

const ChipTest = () => (
  <div className="mdl-grid" >
    <Chip>
      <Avatar title="C" /><span>Cohort tag...</span>
    </Chip>
    <Chip deletable>Deletable tag</Chip>
    <Chip>
      <Avatar style={{backgroundColor: 'deepskyblue'}} icon="folder" />
      <span>Data</span>
    </Chip>
    <Chip>
      <Avatar><img src="https://image.freepik.com/iconos-gratis/celda_318-125781.jpg"/></Avatar>
      <span>Microscopy</span>
    </Chip>
  </div>
);


class Cohort extends Component {

  constructor(props) {
    super(props);
    /* initial state */
    this.state = {
      selectedProjects: [],
      selectedSamples: [],
      sidebarOpen: true
    };

  }


  // the class property is initialized with an arrow function that binds this to the class
  handleClick = (e) => {
    console.log('Something was clicked.',e);
  }

  showCohortSamples = (cohortId) => {
    // alert("Add sample(s) goes here ... ");
    var O = Ophion();
    // [{"has":{"key":"gid","value":{"s":"type:IndividualCohort"}}},{"out":{"labels":["hasInstance"]}},{"limit":1}]
    //O.query().has("gid","type:Biosample").outgoing("hasInstance").limit(2).execute(function(x){console.log(x)});
    O.query().has("gid", cohortId).outgoing("hasMember").incoming("biosampleOfIndividual").limit(20).execute(function(x){console.log(x)});
    O.query().has("gid", cohortId).outgoing("hasMember").incoming("biosampleOfIndividual").count().execute(function(x){console.log(x)});
  };

  cohortClicked = (row) => {
    console.log('cohortClicked', row);
    if (row.selected) {
      this.setState({selectedProjects: _.union(this.state.selectedProjects, [row.gid])})
    } else {
      this.setState({selectedProjects: _.filter(this.state.selectedProjects, function(gid){ return gid != row.gid; } )})
    }
  }

  cohortSelected = (row) => {
    console.log('cohortSelected', row);
  }

  sampleClicked = (row) => {
    console.log('sampleClicked', row);
  }

  sampleSelected = (row) => {
    console.log('sampleSelected', row);
  }

  onSetSidebarOpen = (open) => {
    this.setState({sidebarOpen: open});
  }


  render() {
    // cohort and all members
    let samples = null ;
    Ophion.prototype.testMonkey = function(msg) {console.log('testMonkey2'); };
    var O = Ophion();
    if (this.state.selectedProjects.length > 0) {
      console.log('this.state.selectedProjects',this.state.selectedProjects);
      var ophionQuery = O.query().has("gid",O.within(this.state.selectedProjects)).outgoing("hasMember");
      samples = <div>
        <h2>Individuals: {this.state.selectedProjects}</h2>
        <OphionTable
          query={ophionQuery}
          onRowClick={this.sampleClicked}
          onSelect={this.sampleSelected}
          hiddenProperties={["gid"]}
        />
      </div>  ;
    } else {
      samples = <h2>Click on cohort</h2> ;
    }

    //Ophion().query().has("gid","type:IndividualCohort").outgoing("hasInstance")
    Ophion.prototype.testMonkey = function(msg) {console.log('testMonkey'); };
    var O = Ophion();
    let mainContent =
      <div>
        <div className="mdl-grid">
          <div className="mdl-cell mdl-cell--12-col mdl-cell--rght">
            <ChipTest/>
          </div>
          <div className="mdl-cell mdl-cell--12-col mdl-cell--rght">
            {samples}
          </div>
          <div className="mdl-cell mdl-cell--12-col mdl-cell--rght">
            <TooltipButton icon='add' floating accent onClick={this.handleAdd}  tooltip='Another Tooltip'  style={{'float':'right'}} />
          </div>
        </div>
      </div> ;

    var ophionQuery = O.query().has("gid", "type:IndividualCohort").outgoing("hasInstance").match([
      O.mark('cohort').values(["gid"]).mark("gid"),
      O.mark('cohort').values(["name"]).mark("name"),
      O.mark("cohort").outEdge('hasMember').count().mark('count')
      ]).select(['gid', 'name', 'count']);
    ophionQuery.testMonkey = function(msg) {console.log('testMonkey2:'+ msg)};
    return (
      <OphionSidebar
        query={ophionQuery}
        legend='Project'
        onProjectSelect={this.cohortClicked}>
        {mainContent}
      </OphionSidebar>
    ) ;
  }

}

// when page loads, render component
window.onload = function() {
  render(<Cohort name="All" filter="" />, document.getElementById('cohorts'));
}
