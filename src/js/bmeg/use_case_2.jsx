import React, {Component} from 'react'
import {render} from 'react-dom'
import * as _ from 'underscore'
// import * as classNames from 'classnames'
import cytoscape from 'cytoscape'
import * as ReactFauxDOM from 'react-faux-dom'
import * as d3 from 'd3'
import {Ophion} from 'ophion'
import 'whatwg-fetch'

// import {PieChart,VertexViewer,SchemaGraph,foo} from 'ceto'
// import {PieChart} from 'ceto'

var hasOwn = {}.hasOwnProperty

/*
██    ██ ███████ ███████          ██████  █████  ███████ ███████         ██████
██    ██ ██      ██              ██      ██   ██ ██      ██                   ██
██    ██ ███████ █████           ██      ███████ ███████ █████            █████
██    ██      ██ ██              ██      ██   ██      ██ ██              ██
 ██████  ███████ ███████ ███████  ██████ ██   ██ ███████ ███████ ███████ ███████
*/

// jsx from use_case_2.jsx
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import
// import {use_case_2} from "./use_case_2.jsx";
//
// 20170330 chrisw
// I couldn't get the use_case_2 object to load correctly from a separate file, so now I try appending use_case_2 scripts here.
// I try to keep the use_case_2 parts from contaminating the pre-existing vertex.jsx parts.

// additional libraries for use_case_2
const $ = require('jquery');

$.DataTable = require('datatables.net');

// https://www.npmjs.com/package/datatables.net-select
// require( 'datatables.net-select' )( window, $ );

// console.log("$.DataTable:" + $.DataTable);

const Highcharts = require('highcharts');

export var use_case_2 = {};

(function(uc2) {
  "use strict";

  uc2.containerElemId = 'use_case_2_div';

  /*
██████   █████  ████████  █████      ████████  █████  ██████  ██      ███████
██   ██ ██   ██    ██    ██   ██        ██    ██   ██ ██   ██ ██      ██
██   ██ ███████    ██    ███████        ██    ███████ ██████  ██      █████
██   ██ ██   ██    ██    ██   ██        ██    ██   ██ ██   ██ ██      ██
██████  ██   ██    ██    ██   ██        ██    ██   ██ ██████  ███████ ███████
*/

  var stringifiedWikipediaLink = function(article_title) {
    var s = "<a title='" + article_title + "' href='https://en.wikipedia.org/wiki/" + article_title + "' target='_" + article_title + "'>" + article_title + "</a>";
    return s;
  };

  var stringifiedGoogleLink = function(search_terms) {
    var s = "<a title='search google' href='https://www.google.com/?q=" + search_terms.join("+") + "' target='_blank'>search</a>";
    return s;
  };

  // var stringifiedExploreGraphLink = function(nodeID, text) {
  //     var url = Meteor.absoluteUrl() + "explore_graph/" + encodeURIComponent(nodeID);
  //     var s = "<a title='explore_graph' href='" + url + "' target='_bmeg_explore'>" + text + "</a>";
  //     return s;
  // };

  var validateInput = function(inputSigs) {

    if (_.isUndefined(inputSigs) || _.isNull(inputSigs)) {
      return false;
    }

    if (inputSigs.length < 1) {
      return false;
    }

    // if (inputSigs.length != 1) {
    // return false;
    // }
    return true;
  };

  var getSignatureDisplayName = function(origName) {
    // strip off text preceding ":"
    var prefixRe = /^(.*?)\:/i;
    // strip off trailing "_median"
    var suffixRe = /_median$/i;
    var displayName = origName.replace(prefixRe, "").replace(suffixRe, "");
    // strip off trailing concentration
    suffixRe = /(_[\d]+)+_mol_mol$/i;
    displayName = displayName.replace(suffixRe, "");
    return displayName;
  };

  function processQuartileObj(quartileObj) {
    var precision = 3;

    quartileObj.low = (quartileObj.minimum);
    quartileObj.q1 = (quartileObj.first);
    quartileObj.median = (quartileObj.second);
    quartileObj.q3 = (quartileObj.third);
    quartileObj.high = (quartileObj.maximum);
  };

  function processDataForDataTables(dataObjs) {
    var processedDataObjs = [];

    _.each(dataObjs, function(dataObj) {
      var signatureMetadata = dataObj.signatureMetadata;
      var score = dataObj.significance;
      score = Number.parseFloat(score).toPrecision(3);
      var name = signatureMetadata.eventID;
      var median_shift = "NA";
      if ((_.isUndefined(dataObj.sampleGroupDetails) || _.isUndefined(dataObj.backgroundGroupDetails))) {
        console.log("no sample group details");
      } else {
        median_shift = (dataObj.sampleGroupDetails.quartiles.second) - (dataObj.backgroundGroupDetails.quartiles.second);
        median_shift = Number.parseFloat(median_shift).toPrecision(3);
        processQuartileObj(dataObj.backgroundGroupDetails.quartiles);
        processQuartileObj(dataObj.sampleGroupDetails.quartiles);
      }
      processedDataObjs.push({
        eventID: signatureMetadata.eventID,
        name: name,
        score: score,
        median_shift: median_shift,
        backgroundGroupDetails: dataObj.backgroundGroupDetails,
        sampleGroupDetails: dataObj.sampleGroupDetails
      });
    });

    return processedDataObjs;
  };

  function renderSigResultsDataTable(dataObjs, containerTableTagId) {
    var containerTableTagElem = document.getElementById(containerTableTagId);
    while (containerTableTagElem.firstChild) {
      containerTableTagElem.removeChild(containerTableTagElem.firstChild);
    }

    var processedDataObjs = processDataForDataTables(dataObjs);

    var columnObjs = [
      {
        data: "eventID",
        title: "SIGNATURE NAME",
        // render: function(data, type, row) {
        //     displayName = getSignatureDisplayName(data);
        //     return displayName;
        // }
        render: function(data, type, row) {
          // var s = stringifiedExploreGraphLink(data, getSignatureDisplayName(data));
          // return s;
          var s = getSignatureDisplayName(data);
          return s;
        }
      }
    ];

    // wikipedia
    columnObjs.push({
      data: "name",
      title: "Wikipedia",
      render: function(data, type, row) {
        var displayName = getSignatureDisplayName(data);
        var links = [];
        _.each(displayName.split(/_/), function(drugName) {
          var s = stringifiedWikipediaLink(drugName);
          links.push(s);
        });
        return links.join(", ");
      }
    });

    // google search column
    columnObjs.push({
      data: "name",
      title: "Google Search",
      render: function(data, type, row) {
        var displayName = getSignatureDisplayName(data);
        // var search_terms = _.union(displayName.split(/_/), Session.get("geneList"));
        var search_terms = displayName.split(/_/);
        var s = stringifiedGoogleLink(search_terms);
        return s;
      }
    });

    // add score column
    columnObjs.push({data: "median_shift", title: "median shift"});
    columnObjs.push({data: "score", title: "KS significance"});

    // default column to sort
    var orderObj;
    var lastColIndex = columnObjs.length - 1;
    orderObj = [
      [lastColIndex, "asc"]
    ];

    // console.log("processedDataObjs: " + JSON.stringify(processedDataObjs));
    // console.log("columnObjs: " + JSON.stringify(columnObjs));
    // console.log("orderObj: " + JSON.stringify(orderObj));

    var sigResultsDataTableObj = $("#" + containerTableTagId).DataTable({
      // supposed to make this object retrievable by ID
      // bRetrieve : true,
      // turn on select extension
      select: true,
      data: processedDataObjs,
      columns: columnObjs,
      order: orderObj
    });

    // sigResultsDataTableObj.on('click', 'tr', function() {
    //     if ($(this).hasClass('selected')) {
    //         $(this).removeClass('selected');
    //     } else {
    //         sigResultsDataTableObj.$('tr.selected').removeClass('selected');
    //         $(this).addClass('selected');
    //     }
    // });

    sigResultsDataTableObj.on('select', function(e, dt, type, indexes) {
      console.log("select handler");
      if (type === 'row') {
        console.log("selected a row");
      }
    });

    sigResultsDataTableObj.on('deselect', function(e, dt, type, indexes) {
      console.log("deselect handler");
      if (type === 'row') {
        console.log("deselected a row");
      }
    });

    return sigResultsDataTableObj;
  };

  function setQueryInfoP(query, backgroundSize, sampleSize) {
    var id = "queryInfoP";
    var pElem = document.getElementById(id);
    if (query != null) {
      pElem.innerHTML = "size of sample set with variant in " + query + ": " + sampleSize + "<br>" + "size of sample set with no variant in " + query + ": " + backgroundSize;
    } else {
      pElem.innerHTML = ""
    }
    return null;
  }

  /*
 ██████  ██████  ███    ███ ██████   ██████  ███    ██ ███████ ███    ██ ████████ ███████
██      ██    ██ ████  ████ ██   ██ ██    ██ ████   ██ ██      ████   ██    ██    ██
██      ██    ██ ██ ████ ██ ██████  ██    ██ ██ ██  ██ █████   ██ ██  ██    ██    ███████
██      ██    ██ ██  ██  ██ ██      ██    ██ ██  ██ ██ ██      ██  ██ ██    ██         ██
 ██████  ██████  ██      ██ ██       ██████  ██   ████ ███████ ██   ████    ██    ███████
*/

  var ThrobberComponent = React.createClass({
    render() {
      var loading;
      if (this.props.loading) {
        loading = <img id="throbber_img" src="/static/ripple.gif" width="50px" alt="ripple.gif" title="loading"/>
      } else {
        loading = <span></span>
      }
      return (loading)
    }
  })

  // http://blog.revathskumar.com/2015/07/submit-a-form-with-react.html
  var SubmitGeneFormComponent = React.createClass({
    getInitialState() {
      return {signaturesData: [], inputValue: "", loading: false, errors: {}}
    },
    _onChange: function(e) {
      var state = {};
      state[e.target.name] = e.target.value.toUpperCase();
      this.setState(state);
      // console.log("state change: " + JSON.stringify(state));
    },
    validateInput: function(input) {
      var isValid = true;
      return isValid;
    },
    fetchCallback: function(responseJson) {
      console.log(JSON.stringify(responseJson[0], null, '\t'));

      var query = responseJson[0]["signatureMetadata"]["featureWeights"][0]["feature"];
      var sizeBackground = responseJson[0]["backgroundGroupDetails"]["size"];
      var sizeSample = responseJson[0]["sampleGroupDetails"]["size"];
      console.log("query:" + query);
      console.log("sizeBackground:" + sizeBackground);
      console.log("sizeSample:" + sizeSample);
      // var processedDataObjs = processDataForDataTables(responseJson);
      // console.log("processedDataObjs: " + JSON.stringify(processedDataObjs, null, '\t'));

      setQueryInfoP(query, sizeBackground, sizeSample);

      var sigResultsDataTableObj = renderSigResultsDataTable(responseJson, 'sigResultsTable');

      this.setState({loading: false});
    },
    fetchErrorHandler: function(err) {
      console.log('Fetch Error :-S', err);
      document.getElementById("submit_gene_button").setAttribute("disabled", false);
    },
    handleClick: function(e) {
      e.preventDefault;

      this.setState({loading: true});

      var isValid = this.validateInput(this.state.inputValue);
      if (isValid) {
        // valid input
      } else {
        alert("invalid input");
        return null;
      }

      var geneId = this.state.inputValue;
      console.log("query GAIA with geneId: " + geneId);

      // query gaia server
      // https://davidwalsh.name/fetch
      var request = new Request('/gaea/signature/mutation', {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        headers: new Headers({'Content-Type': 'text/plain'}),
        body: JSON.stringify([geneId])
      });

      fetch(request).then(function(response) {
        return response.json()
      }).then(this.fetchCallback).catch(this.fetchErrorHandler);
    },
    render() {
      var textBox = <input name="inputValue" value={this.state.inputValue} onChange={this._onChange} id="geneSymbolTextBox" type="text" title="specify a HUGO symbol for a gene" placeholder="HUGO symbol" size="30"/>
      var button = <button type="submit" onClick={this.handleClick} disabled={this.state.loading} id="submit_gene_button" title="submit the HUGO symbol">Submit the gene!</button>
      var component = <div id="SubmitGeneFormComponent">
        {textBox}{button}<ThrobberComponent loading={this.state.loading}/>
      </div>;

      return (component)
    }
  })

  // collect components into a single element that can be used with render
  var use_case_2_components = function() {
    var geneForm = <SubmitGeneFormComponent/>
    return (
      <div>{geneForm}</div>
    )
  }

  /*
██ ███    ██ ██ ████████ ██  █████  ██      ██ ███████ ███████
██ ████   ██ ██    ██    ██ ██   ██ ██      ██    ███  ██
██ ██ ██  ██ ██    ██    ██ ███████ ██      ██   ███   █████
██ ██  ██ ██ ██    ██    ██ ██   ██ ██      ██  ███    ██
██ ██   ████ ██    ██    ██ ██   ██ ███████ ██ ███████ ███████
*/

  uc2.initialize = function() {
    console.log("uc2.initialize() in use_case_2.jsx");
    var containerElemId = uc2.containerElemId;
    var containerElem = document.getElementById(containerElemId);
    console.log(containerElem);
    var components = use_case_2_components()
    render(
      <div>{components}</div>, containerElem);
  }
})(use_case_2)

window.onload = function() {
  // initialize()

  try {
    initialize()
  } catch (err) {
    console.log("got an error with initialize: " + err.message);
  }

  try {
    console.log("check loading of datatables and highcharts");
    var jquery_ver = $.fn.jquery
    console.log("jquery_ver: " + jquery_ver);
    console.log("$.DataTable: " + $.DataTable);
    console.log("Highcharts: " + Highcharts);
    use_case_2.initialize();
  } catch (err) {
    console.log("got an error with use_case_2.initialize: " + err.message);
  }
}

export {queries}
