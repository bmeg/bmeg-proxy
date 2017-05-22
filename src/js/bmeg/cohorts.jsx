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
import { Table, TableHead, TableRow, TableCell } from 'react-toolbox/lib/table';
import Avatar from 'react-toolbox/lib/avatar';
import Chip from 'react-toolbox/lib/chip';
import Dialog from 'react-toolbox/lib/dialog';

// tooltip versions
const TooltipButton = Tooltip(Button);
const TooltipCell = Tooltip(TableCell);


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
    this.state = { selected: [], source: [] };
    // this.state.source =
    //   _.map(this.props.members.split(','), function(memberId) {
    //       return( {id:memberId, name:memberId+"'s name", favorite: memberId == 'A' } );
    //     }) ;
    console.log('constructor',this.state)
  }

  componentWillMount() {
    // given filter:[] 'fetch' the data
    // TODO - apply filter
    var _self = this;
    console.log(_);
    Ophion().query().has("gid","type:IndividualCohort").outgoing("hasInstance")
     .limit(99).execute(function(cohorts){
      console.log('callback', cohorts);
      _self.state.source =
        _.map(cohorts, function(cohort) {
          return( {id:cohort.properties.id, name:cohort.properties.name, favorite: false } );
        }) ;
      _self.setState(_self.state);
    });
    console.log('componentWillMount',this.state)
  }




  // the class property is initialized with an arrow function that binds this to the class
  handleClick = (e) => {
    console.log('Something was clicked.',e);
  }



 handleFavorite = (e) => {
   var member = _.find(this.state.source, function(member){ return member.id == e.target.dataset.id; });
   member.favorite = !member.favorite;
   this.setState({ favorite: member.favorite });
 };

 handleDelete = (e) => {
   var deleteMe = confirm("Do you really want to delete? This cannot be undone.");
   if (deleteMe) {
     this.state.source = _.filter(this.state.source, function(member){ return member.id != e.target.dataset.id; });
     this.setState({});
   }
 };

  handleAdd = () => {
    // alert("Add sample(s) goes here ... ");
    var O = Ophion();
    // [{"has":{"key":"gid","value":{"s":"type:IndividualCohort"}}},{"out":{"labels":["hasInstance"]}},{"limit":1}]
    O.query().has("gid","type:IndividualCohort").outgoing("hasInstance").limit(2).execute(function(x){console.log(x)});
    // O.query().limit(1).execute(function(x){console.log(x)});
  };


  handleSelect = (selected) => {
    console.log('handleSelect clicked.', selected);
    this.setState({ selected: selected.map(item => this.state.source[item].id) });
  };


  render() {
    // cohort and all members
    return (
      <div>
        <ChipTest/>
        <h1>Cohorts: {this.props.name}</h1>
        <Table multiSelectable onRowSelect={this.handleSelect} style={{ marginTop: 10 }}>
          <TableHead>
            <TooltipCell onClick={this.handleClick} tooltipPosition="left" tooltip="The cohort's id">
              Id
            </TooltipCell>
            <TooltipCell onClick={this.handleClick} tooltipPosition="left" tooltip="The cohort's Name">
              Name
            </TooltipCell>
            <TooltipCell onClick={this.handleClick} tooltipPosition="left" tooltip="Actions you can take on a cohort">
              Actions
            </TooltipCell>
          </TableHead>
          {this.state.source.map((item, idx) => (
            <TableRow key={idx} selected={this.state.selected.indexOf(item.id) !== -1}>
              <TableCell>{item.id}</TableCell>
              <TableCell>
                {item.name}
              </TableCell>
              <TableCell>
                <IconButton
                  icon={item.favorite ? 'favorite' : 'favorite_border' }
                  accent={item.favorite}
                  data-id={item.id}
                  onClick={this.handleFavorite} />
                <IconButton
                  icon='delete_forever'
                  data-id={item.id}
                  onClick={this.handleDelete} />

              </TableCell>

            </TableRow>
          ))}
        </Table>
        <div className="mdl-grid">
          <div className="mdl-cell mdl-cell--12-col mdl-cell--rght">
            <TooltipButton icon='add' floating accent onClick={this.handleAdd}  tooltip='Another Tooltip'  style={{'float':'right'}} />
          </div>
        </div>
      </div>
    ) ;

  }
}

// when page loads, render component
window.onload = function() {
  render(<Cohort name="All" filter="" />, document.getElementById('cohorts'));
}
