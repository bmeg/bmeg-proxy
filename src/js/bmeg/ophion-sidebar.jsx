// required for all components
import React,{Component} from 'react'
import {render} from 'react-dom'

// required to query bmeg
import {Ophion} from 'ophion'


// use this instead of boilerplate
import * as _ from 'underscore'


//third party dependency
import Sidebar from 'react-sidebar';
import { List, ListItem, ListSubHeader, ListDivider, ListCheckbox } from 'react-toolbox/lib/list';
import Tooltip from 'react-toolbox/lib/tooltip';
// TODO - tooltip doesn't work see https://github.com/react-toolbox/react-toolbox/issues/1495
const TooltipListCheckbox = Tooltip(ListCheckbox);

//our dependency
import OphionFacet from './ophion-facet.jsx';

export default class OphionSidebar extends Component {

  // setup
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

  // saved queries
  renderUserStorage = () => {
    return <div>
      <OphionFacet
        query={{execute: function(callBack){callBack([{gid:'foo', name:'foo'}])}}}
        caption='My queries'
        leftIcon='folder'
        afterExecute={this.afterExecute}
        onItemSelect={query => {
            console.log('UserStorage onItemSelect',query);
            if (this.props.onQuerySelect) {
              this.props.onQuerySelect(query);
            }
          }
        }
      />
    </div> ;
  }

  // projects
  renderProjects = () => {
    var O = Ophion();
    var ophionQuery = O.query().has("gid", "type:IndividualCohort").outgoing("hasInstance").match([
      O.mark('cohort').values(["gid"]).mark("gid"),
      O.mark('cohort').values(["name"]).mark("name"),
      O.mark("cohort").outEdge('hasMember').count().mark('count')
      ]).select(['gid', 'name', 'count']);
      return <div>
        <OphionFacet
          query={ophionQuery}
          caption='Projects'
          leftIcon='business_center'
          afterExecute={this.afterExecute}
          onItemSelect={item => {
              console.log('Projects onItemSelect',item)
              if (this.props.onProjectSelect) {
                this.props.onProjectSelect(item);
              }
            }
          }
        />
      </div> ;
  }

  // gender
  renderGenders = () => {
    var O = Ophion();
    var ophionQuery = O.query().has("gid","type:Individual").outgoing("hasInstance").groupCount("info.gender");
    var _self = this ;
    return <div>
      <OphionFacet
        query={ophionQuery}
        caption='Genders'
        leftIcon='invert_colors'
        afterExecute={ ophionObjects => {
            var mappedOphionData = [] ;
            console.log('gender afterExecute',ophionObjects)
            mappedOphionData.push({name:'FEMALE', gid: '["FEMALE"]', count: ophionObjects[0]['["FEMALE"]'] });
            mappedOphionData.push({name:'MALE', gid: '["MALE"]', count: ophionObjects[0]['["MALE"]'] });
            return mappedOphionData;
          }
        }
        onItemSelect={item => {
            console.log('Genders onItemSelect',item,this.props.onGenderSelect)
            if (_self.props.onGenderSelect) {
              _self.props.onGenderSelect(item);
            }
          }
        }
      />
    </div> ;
  }

  // tumorStatus
  renderTumorStatus = () => {
    var O = Ophion();
    var ophionQuery = O.query().has("gid","type:Individual").outgoing("hasInstance").groupCount("info.tumorStatus");
    var _self = this ;
    return <div>
      <OphionFacet
        query={ophionQuery}
        caption='TumorStatus'
        leftIcon='swap_calls'
        afterExecute={ ophionObjects => {
            var mappedOphionData = [] ;
            console.log('tumorStatus afterExecute',ophionObjects)
            mappedOphionData.push({name:'TUMOR FREE', gid: '["TUMOR FREE"]', count: ophionObjects[0]['["TUMOR FREE"]'] });
            mappedOphionData.push({name:'WITH TUMOR', gid: '["WITH TUMOR"]', count: ophionObjects[0]['["WITH TUMOR"]'] });
            return mappedOphionData;
          }
        }
        onItemSelect={item => {
            console.log('Genders onItemSelect',item,this.props.onTumorStatusSelect)
            if (_self.props.onTumorStatusSelect) {
              _self.props.onTumorStatusSelect(item);
            }
          }
        }
      />
    </div> ;
  }





  // facet will call this callback for common result processing
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

  // react render component
  render() {
    // ophion data and all members
    let sidebarContent =
      <List selectable ripple >
        <ListSubHeader caption={this.props.caption}/>
        {this.renderProjects()}
        {this.renderGenders()}
        {this.renderTumorStatus()}
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
