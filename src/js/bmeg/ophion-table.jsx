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
    console.log('OphionTable contructor')

    /* initial state */
    this.state = {
      selected: {},
      source: [],
      sorted: [],
      page: 0,
      pages: 1,
      max_pages: null,
      pageSize: 10,
      loading: true
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
      this.handlePageChange({page: 0})
    }
  }

  componentWillMount() {
    console.log('componentWillMount',this);
    this.handlePageChange({page: 0})
  }

  _query(ophionQuery) {
    var _self = this;
    var properties = []
    var startTime = new Date();
    // copy the query so we can alter it with range()
    var pagingQuery = Ophion().query()
    pagingQuery.query.push.apply(pagingQuery.query, JSON.parse(JSON.stringify(ophionQuery)).query)

    var lower = this.state.pageSize * this.state.page;
    var upper = lower + this.state.pageSize ;
    console.log('_query', {lower: lower, upper: upper});
    this.setState({loading: true})
    pagingQuery.range(lower,upper).execute(function(ophionObjects){
      console.log('ophionObjects', ophionObjects);
      var endTime = new Date();
      console.log(JSON.stringify(ophionQuery), 'took ',  endTime - startTime, 'ms');
      var mappedOphionData = [];
      if (ophionObjects.length === 1 && ophionObjects[0] === "") {
        mappedOphionData = []
      } else {
        mappedOphionData =
          _.map(ophionObjects, function(ophionObject) {
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
      }

      var new_pages = _self.state.pages;
      var max_pages = _self.state.max_pages;
      // increment if we get data
      if (mappedOphionData.length > 0) {
        new_pages += 1;
      } else {
        max_pages = new_pages;
      }
      // don't go past max_pages
      if (max_pages) {
        new_pages = max_pages;
      }

      console.log('mappedOphionData.length', mappedOphionData.length);
      console.log('mappedOphionData', mappedOphionData);
      _self.setState({
        source: mappedOphionData,
        loading: false,
        pages: new_pages,
        max_pages: max_pages
      });

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


  handlePageChange = (page) => {
    this.setState(page, function() {
      this._query(this.props.query);
    } ) ;
  };


  handleSortedChange = (sorted) => {
    console.log('handleSortedChange', sorted);
    sorted.page = 0 ;
    this.setState(sorted);
    this._query(this.props.query);
  };


  render() {
    // ophion data and all members
    return (
      <div>
        <ReactTable
          manual // Forces table not to paginate or sort automatically, so we can handle it server-side
          className='-striped -highlight'
          pages={this.state.pages}
          data={this.state.source}
          loading={this.state.loading} // Display the loading overlay when we need it
          columns={this.columns}
          sorted={this.state.sorted}
          page={this.state.page}
          pageSize={this.state.pageSize}
          onSortedChange={sorted => this.handleSortedChange({sorted})}
          onPageChange={page => this.handlePageChange({page})}
          onPageSizeChange={(pageSize, page) => this.setState({page, pageSize})}
          onFetchData={this.fetchData} // Request new data when things change
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
