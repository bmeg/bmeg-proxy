import React,{Component} from 'react'
import {render} from 'react-dom'
import * as _ from 'underscore'
import cytoscape from 'cytoscape'
import * as ReactFauxDOM from 'react-faux-dom'
import * as d3 from 'd3'
import 'whatwg-fetch'


function cohortsInitialize() {
  console.log('cohortsInitialize', document.getElementById('cohorts'))
  document.getElementById('cohorts').innerHTML = "//TODO - react component goes here";
}

window.onload = function() { cohortsInitialize() }
