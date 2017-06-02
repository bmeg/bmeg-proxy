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




export default class OphionFacet extends Component {

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
      itemsTotal: 0
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
    var startTime = new Date();
    ophionQuery.execute(function(ophionObjects){
      var mappedOphionData = ophionObjects;
      if (_self.props.afterExecute) {
        mappedOphionData = _self.props.afterExecute(ophionObjects);
      }
      var endTime = new Date();
      console.log(JSON.stringify(ophionQuery), 'took ',  endTime - startTime, 'ms');
      _self.setState({source: mappedOphionData});
      console.log('mappedOphionData', 'after setState');
    });
  }



  // workhorse: render list of all Item Instances
  renderItems = () => {
    var count = 0 ;
    var _self = this ;
    var itemItems = [];
    // render individual list member clickable value
    var renderItemListCheckbox = (item) => {
      var legend = item.name ;
      if (item.count) {
        legend += ' (' + item.count +')' ;
      }
      return <TooltipListCheckbox
                onChange={checked =>{
                    console.log('onChange',checked);
                    console.log('onChange',item.gid);
                    item.selected = !item.selected ;
                    // redraw TODO - itemize state update
                    this.setState({});
                    // tell listeners e.g. parent
                    if (this.props.onItemSelect) {
                      this.props.onItemSelect(item);
                    }
                  }
                }
                floating accent tooltip='fooo'
                checked={item.selected}
                legend={legend}
                key={item.gid}
                id={item.gid}
                //TODO - css property file: reimplement in react
                className='sidebar-subitem'/>
    } ;

    if (!_self.state.showLess) {
      itemItems = _.reduce(this.state.source,
        function(memo, item){
          count++;
          if (!item) {
            return memo;
          }
          if (count < 3 ) {
            memo.push(
              renderItemListCheckbox(item)
            );
          }
          if (count == 3 ) {
            memo.push(
              <div key={item.gid}>
                {renderItemListCheckbox(item)}
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
      itemItems = _.map(this.state.source, function(item) {
        return renderItemListCheckbox(item);
      });
      itemItems.push(
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
        legend={this.props.caption + ' (' + this.state.source.length + ')'}
        leftIcon={this.props.leftIcon}
        rightIcon={this.state.isHidden ? 'arrow_drop_up' : 'arrow_drop_down'}
        onClick={e =>{
            console.log('ListItem click');
            this.setState({isHidden: !this.state.isHidden})
          }
        }
      />

      {!this.state.isHidden ? null :
        <div>
        {itemItems}
        </div>
      }
    </div>
  }

  render() {
    // ophion data and all members
    console.log('Facet render.');

    return (
      this.renderItems()
    ) ;
  }
}
