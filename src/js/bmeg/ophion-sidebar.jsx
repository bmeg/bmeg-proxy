// required for all components
import React,{Component} from 'react'
import {render} from 'react-dom'

// required to query bmeg
import {Ophion} from 'ophion'


// use this instead of boilerplate
import * as _ from 'underscore'


//dependency
import Sidebar from 'react-sidebar';
import { List, ListItem, ListSubHeader, ListDivider, ListCheckbox } from 'react-toolbox/lib/list';
import Tooltip from 'react-toolbox/lib/tooltip';
// TODO - tooltip doesn't work see https://github.com/react-toolbox/react-toolbox/issues/1495
const TooltipListCheckbox = Tooltip(ListCheckbox);

//our package
import OphionFacet from './ophion-facet.jsx';




export default class OphionSidebar extends Component {

  constructor(props) {
    super(props);

    /* initial state */
    this.state = {
      selected: {},
      source: [],
      sorted: [],
      page: 0,
      pageSize: 10,
      isHidden: true,
      showLess: false,
      projectsTotal: 0
    };

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
    console.log(JSON.stringify(ophionQuery));
    console.log('testMonkey type' , typeof ophionQuery.testMonkey);
    if (ophionQuery.testMonkey) {
      ophionQuery.testMonkey('Hi');
    }
    ophionQuery.execute(function(ophionObjects){
      ophionObjects = _.sortBy(ophionObjects, 'count');
      console.log(ophionObjects);
      var mappedOphionData =
        _.map(ophionObjects, function(ophionObject) {
          _self.state.projectsTotal += ophionObject.count ;
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
      } ) ;
      console.log('mappedOphionData.length', mappedOphionData.length);
      console.log('mappedOphionData', mappedOphionData);
      _self.setState({source: mappedOphionData});
      console.log('mappedOphionData', 'after setState');
    });
  }


  // saved queries
  renderUserStorage = () => {
    return <div>
      <OphionFacet
        query={{execute: function(callBack){callBack([{gid:'foo', name:'foo'}])}}}
        caption='My queries'
        leftIcon='folder'
        afterExecute={this.afterExecute}
      />
    </div> ;
  }

  // projects
  renderUserStorage = () => {
    return <div>
      <OphionFacet
        query={{execute: function(callBack){callBack([{gid:'foo', name:'foo'}])}}}
        caption='My queries'
        leftIcon='folder'
        afterExecute={this.afterExecute}
      />
    </div> ;
  }



  renderProjectsOld = () => {
    var count = 0 ;
    var _self = this ;
    var projectItems = [];
    var renderProjectListCheckbox = (project) => {
      return <TooltipListCheckbox
                onChange={checked =>{
                    console.log('onChange',checked);
                    console.log('onChange',project.gid);
                    project.selected = !project.selected ;
                    this.setState({});
                    if (this.props.onProjectSelect) {
                      this.props.onProjectSelect(project);
                    }
                  }
                }
                floating accent tooltip='fooo'
                checked={project.selected}
                legend={project.name + ' (' + project.count +')' }
                key={project.gid}
                id={project.gid}
                className='sidebar-subitem'/>
    } ;

    if (!_self.state.showLess) {
      projectItems = _.reduce(this.state.source,
        function(memo, project){
          count++;
          if (!project) {
            return memo;
          }
          if (count < 3 ) {
            memo.push(
              renderProjectListCheckbox(project)
            );
          }
          if (count == 3 ) {
            memo.push(
              <div key={project.gid}>
                {renderProjectListCheckbox(project)}
                <ListItem
                  legend='show more...'
                  key='show-more'
                  className='sidebar-subitem'
                  rightIcon='arrow_drop_down'
                  onClick={e =>{
                      _self.setState({showLess: !_self.state.showLess})
                    }
                  }
                />
              </div>
            );
          }
          return memo;
        },
        []);
    } else {
      projectItems = _.map(this.state.source, function(project) {
        return renderProjectListCheckbox(project);
      });
      projectItems.push(
        <ListItem
          legend='show less...'
          key='show-less'
          className='sidebar-subitem'
          rightIcon='arrow_drop_up'
          onClick={e =>{
              this.setState({showLess: !this.state.showLess})
            }
          }
        />
      ) ;
    }
    return <div>
      <ListItem
        legend={this.props.legend + ' (' + this.state.source.length + ') (' + this.state.projectsTotal + ')'}
        leftIcon='business_center'
        rightIcon={this.state.isHidden ? 'arrow_drop_up' : 'arrow_drop_down'}
        onClick={e =>{
            console.log('ListItem click');
            this.setState({isHidden: !this.state.isHidden})
          }
        }
      />

      {!this.state.isHidden ? null :
        <div>
        {projectItems}
        </div>
      }
    </div>
  }

  afterExecute(ophionObjects) {
    var properties = []
    ophionObjects = _.sortBy(ophionObjects, 'count');
    console.log(ophionObjects);
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

    console.log('mappedOphionData.length', mappedOphionData.length);
    console.log('mappedOphionData', mappedOphionData);
    return mappedOphionData;
  }

  render() {
    // ophion data and all members
    let sidebarContent =
      <List selectable ripple >
        <ListSubHeader caption='Explore BMEG' />
        {this.renderProjects()}
        <ListDivider />
        {this.renderUserStorage()}
        <ListItem caption='Settings' leftIcon='settings' />
      </List>;

      console.log('Sidebar render.');

    return (
      <Sidebar sidebar={sidebarContent}
        open={this.state.sidebarOpen}
        docked={true}
        sidebarClassName='sidebar-container'
        >
        {this.props.children}
      </Sidebar>
    ) ;
  }
}
