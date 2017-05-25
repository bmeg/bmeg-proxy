




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
      selectedProjectNames: [],
      selectedGenders: [],
      selectedGenderNames: [],
      selectedTumorStatus: [],
      selectedTumorStatusNames: [],
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

  projectClicked = (project) => {
    console.log('projectClicked', project);
    if (project.selected) {
      this.setState({
        selectedProjects: _.union(this.state.selectedProjects, [project.gid]),
        selectedProjectNames: _.union(this.state.selectedProjectNames, [project.name]),
      })
    } else {
      this.setState({
        selectedProjects: _.filter(this.state.selectedProjects, function(gid){ return gid != project.gid; } ),
        selectedProjectNames: _.filter(this.state.selectedProjectNames, function(name){ return name != project.name; } )
      })
    }
  }

  genderClicked = (gender) => {
    console.log('genderClicked', gender);
    if (gender.selected) {
      this.setState({
        selectedGenders: _.union(this.state.selectedGenders, [gender.gid]),
        selectedGenderNames: _.union(this.state.selectedGenderNames, [gender.name]),
      })
    } else {
      this.setState({
        selectedGenders: _.filter(this.state.selectedGenders, function(gid){ return gid != gender.gid; } ),
        selectedGenderNames: _.filter(this.state.selectedGenderNames, function(name){ return name != gender.name; } )
      })
    }
  }

  tumorStatusClicked = (tumorStatus) => {
    console.log('tumorStatusClicked', tumorStatus);
    if (tumorStatus.selected) {
      this.setState({
        selectedTumorStatus: _.union(this.state.selectedTumorStatus, [tumorStatus.gid]),
        selectedTumorStatusNames: _.union(this.state.selectedTumorStatusNames, [tumorStatus.name]),
      })
    } else {
      this.setState({
        selectedTumorStatus: _.filter(this.state.selectedTumorStatus, function(gid){ return gid != tumorStatus.gid; } ),
        selectedTumorStatusNames: _.filter(this.state.selectedTumorStatusNames, function(name){ return name != tumorStatus.name; } )
      })
    }
  }

  queryClicked = (query) => {
    console.log('queryClicked', query);
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
      if (this.state.selectedGenders.length > 0) {
        ophionQuery = ophionQuery.has("info.gender", O.within(this.state.selectedGenders));
      }
      if (this.state.selectedTumorStatus.length > 0) {
        ophionQuery = ophionQuery.has("info.tumorStatus", O.within(this.state.selectedTumorStatus));
      }
      samples = <div>
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
      <div style={{paddingTop:'5em'}}>
        <div className="mdl-grid">
          <div className="mdl-cell mdl-cell--12-col mdl-cell--rght">
            <h5>Projects:{this.state.selectedProjectNames.join(',')}</h5>
            <h5>Genders:{this.state.selectedGenderNames.join(',')}</h5>
            <h5>Tumor Status:{this.state.selectedTumorStatusNames.join(',')}</h5>
          </div>
          <div className="mdl-cell mdl-cell--12-col mdl-cell--rght">
            {samples}
          </div>
          <div className="mdl-cell mdl-cell--12-col mdl-cell--rght">
            <TooltipButton icon='add' floating accent onClick={this.handleAdd}  tooltip='Another Tooltip'  style={{'float':'right'}} />
          </div>
        </div>
      </div> ;

    return (
      <OphionSidebar
        caption='Explore BMEG'
        onProjectSelect={this.projectClicked}
        onQuerySelect={this.queryClicked}
        onGenderSelect={this.genderClicked}
        onTumorStatusSelect={this.tumorStatusClicked}>
        {mainContent}
      </OphionSidebar>
    ) ;
  }

}

// when page loads, render component
window.onload = function() {
  render(<Cohort name="All" filter="" />, document.getElementById('cohorts'));
}
