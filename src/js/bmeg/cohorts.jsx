




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
import Input from 'react-toolbox/lib/input';


import OphionTable from './ophion-table.jsx';
import OphionSidebar from './ophion-sidebar.jsx';

// tooltip versions
const TooltipButton = Tooltip(Button);


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
      sidebarOpen: true,
      activeDialog: false
    };

  }


  handleChange = (name, value) => {
    this.setState({...this.state, [name]: value});
    console.log('handleChange', name, value);
  };

  toggleDialog = () => {
    console.log('toggleDialog', !this.state.activeDialog )
    this.setState({activeDialog: !this.state.activeDialog});
  }

  saveQuery = () => {
    console.log('saveDialog',this.state.queryName, this.state.lastQuery);
    var queriesJSON = localStorage.getItem('queries') || "{}" ;
    var queries = JSON.parse(queriesJSON) ;
    queries[this.state.queryName] = JSON.stringify(this.state.lastQuery);
    localStorage.setItem('queries', JSON.stringify(queries));
    this.toggleDialog();
    this.setState({querySaved: true});
  }

  actions = [
    { label: "Cancel", onClick: this.toggleDialog },
    { label: "Save", onClick: this.saveQuery }
  ];



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
    var ophionQuery = Ophion().query()
    ophionQuery.query.push.apply(ophionQuery.query, JSON.parse(query.query).query)
    this.setState({selectedQuery: ophionQuery });
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
    var O = Ophion();
    var ophionQuery = undefined ;

    if (this.state.selectedQuery) {
      ophionQuery = this.state.selectedQuery ;
      this.state.selectedQuery = undefined ;
    }
    else if (this.state.selectedProjects.length > 0) {
      console.log('this.state.selectedProjects',this.state.selectedProjects);
      var ophionQuery = O.query().has("gid",O.within(this.state.selectedProjects)).outgoing("hasMember");
      if (this.state.selectedGenders.length > 0) {
        ophionQuery = ophionQuery.has("info:gender", O.within(this.state.selectedGenders));
      }
      if (this.state.selectedTumorStatus.length > 0) {
        ophionQuery = ophionQuery.has("info:tumor_status", O.within(this.state.selectedTumorStatus));
      }
    }
    if (ophionQuery) {
      this.state.lastQuery = ophionQuery;
      samples = <div>
        <OphionTable
          query={ophionQuery}
          onRowClick={this.sampleClicked}
          onSelect={this.sampleSelected}
          hiddenProperties={["gid"]}
        />
      </div>  ;
    } else {
      samples = <p/> ;
    }

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
            <Dialog
               actions={this.actions}
               active={this.state.activeDialog}
               onEscKeyDown={this.toggleDialog}
               onOverlayClick={this.toggleDialog}
               title='Save Query'
             >
               <p>Saves query to local storage on this browser. Current query</p>
               <code>
                {JSON.stringify(this.state.lastQuery)}
               </code>
               <Input type='text' label='Name' name='name' value={this.state.queryName} onChange={this.handleChange.bind(this, 'queryName')} maxLength={64} />

            </Dialog>
            <TooltipButton icon='save' floating accent onClick={this.toggleDialog}  tooltip='Save query'  style={{'float':'right'}} />
          </div>
        </div>
      </div> ;

    return (
      <OphionSidebar
        caption='Explore BMEG'
        lastUpdate={new Date()}
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
