// required for all components
import React,{Component} from 'react'
import {render} from 'react-dom'

// required to query bmeg
import {Ophion} from 'ophion'


// use this instead of boilerplate
import * as _ from 'underscore'

import ReactTable from 'react-table'

export default class OphionTable extends Component {

  constructor(props) {
    super(props);

    /* initial state */
    this.state = {
      selected: {},
      source: [],
      sorted: [],
      page: 0,
      pageSize: 10
    };

    // TODO known issue, clicking on the column header produces warning. not sure why
    // warning.js?8a56:36 Warning: ReactTable is changing an uncontrolled input of type checkbox to be controlled. Input elements should not switch from uncontrolled to controlled (or vice versa). Decide between using a controlled or uncontrolled input element for the lifetime of the component. More info: https://fb.me/react-controlled-components
    this.columns = [
      {
        Header:  () => <span>
          <input type='checkbox'
            checked={true}
            value={'selector-header-checked'}
            onChange={e =>{
                var _self = this ;
                this.state.source.forEach(function(r) {
                  _self.state.selected[r.id] = !_self.state.selected[r.id];
                  if (_self.state.selected[r.id] && _self.props.onSelect) {
                    _self.props.onSelect(r);
                  }
                });
                e.preventDefault();
              }
            }
          />
        </span>,
        id: 'selector',
        sortable: true,
        minWidth: 50,
        maxWidth:100,
        accessor: x => this.state.selected[x.id] ? 1 : 2,
        Cell: props => <span >
          <input type='checkbox'
            checked={this.state.selected[props.row.id]}
            value={'selector-row-checked'}
            onChange={e =>{
                this.state.selected[props.row.id] = !this.state.selected[props.row.id];
                if (this.state.selected[props.row.id] && this.props.onSelect) {
                  this.props.onSelect(props.row);
                }
              }
            }
          />
        </span>
      }
    ] ;

  }

  componentWillReceiveProps(nextProps) {
    console.log('componentWillReceiveProps',this, nextProps);
    if (JSON.stringify(this.props.query) !== JSON.stringify(nextProps.query)) {
      this._query(nextProps.query);
    }
  }

  componentWillMount() {
    console.log('componentWillMount',this);
    this._query(this.props.query);
  }

  _query(ophionQuery) {
    // given filter:[] 'fetch' the data
    // TODO - apply filter, limit, paging
    var _self = this;
    var properties = []
    var startTime = new Date();
    ophionQuery.execute(function(ophionObjects){
      console.log(ophionObjects);
      var endTime = new Date();
      console.log(JSON.stringify(ophionQuery), 'took ',  endTime - startTime, 'ms');      
      var mappedOphionData =
        _.map(ophionObjects, function(ophionObject) {
          _.each(_.keys(ophionObject.properties), function(key){
            var parts = key.split('.');
            if (parts[0] === 'info' && !ophionObject.properties['info']) {
              ophionObject.properties.info = {};
            }
            if (parts[0] === 'info' && !ophionObject.properties.info[parts[1]]) {
              var val = JSON.parse(ophionObject.properties[key]);
              if (_.isArray(val)) {
                if (val.length === 1) {
                  val = val[0]
                }
              }
              ophionObject.properties.info[parts[1]] = val;
            }

          });
          if (ophionObject.properties) {
            properties = _.union(properties, _.keys(ophionObject.properties));
            properties = _.without(properties, 'info')
            return(ophionObject.properties);
          } else {
            properties = _.union(properties, _.keys(ophionObject));
            properties = _.without(properties, 'info')
            return(ophionObject);
          }
        }) ;
      // add properties to table, hide if hidden or starts with '#'
      _.each(properties, function(property)  {
        var col = {accessor: property, Header:property }
        if (_.contains(_self.props.hiddenProperties, property) || property.startsWith('#')) {
          col.show = false;
        }
        var already = _.find(_self.columns, function(c) { return c.accessor === col.accessor})
        if (!already) {
          _self.columns.push(col);
        }
      } ) ;
      console.log('columns.length', _self.columns.length);
      console.log('mappedOphionData.length', mappedOphionData.length);
      console.log('mappedOphionData', mappedOphionData);
      _self.setState({source: mappedOphionData});
    });
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

  handleAdd = (e) => {
    alert("Add clicked ... ");
  };

  handleSelect = (selected) => {
    console.log('handleSelect clicked.', selected);
    this.setState({ selected: selected.map(item => this.state.source[item].id) });
  };


  render() {
    // ophion data and all members
    return (
      <div>
        <ReactTable
          data={this.state.source}
          columns={this.columns}
          sorted={this.state.sorted}
          page={this.state.page}
          pageSize={this.state.pageSize}
          onSortedChange={sorted => this.setState({sorted})}
          onPageChange={page => this.setState({page})}
          onPageSizeChange={(pageSize, page) => this.setState({page, pageSize})}
          getTdProps={(state, rowInfo, column, instance) => {
            return {
              onClick: e => {
                // console.log('A Td Element was clicked!')
                // console.log('it produced this event:', e)
                // console.log('It was in this column:', column)
                // console.log('It was in this row:', rowInfo)
                // console.log('It was in this table instance:', instance)
                // if the caller provided a callback, call it
                if (column.id != 'selector' && this.props.onRowClick) {
                  // this.props.onRowClick(e,column,rowInfo,instance, this.state);
                  this.props.onRowClick(rowInfo.row);
                }
              }
            }
          }}
        />
      </div>
    ) ;
  }
}
