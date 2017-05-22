---
title: Mutation to Drug Sensitivity
search: true

javascript:
  - https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js
  - https://fb.me/react-0.14.2.js
  - https://fb.me/react-dom-0.14.2.js
  - https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.23/browser.min.js
  - https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.6/d3.min.js
  - /js/use_case_2.bundle.js

---

<div>
  <br>
  <br>
  <h5>What are the drug sensitivity signatures associated with a given genomic variant?</h5>
  <p>The BMEG team has generated many drug sensitivity signatures from CCLE data. These drug sensitivity signatures can be applied to the expression data of the many thousands of TCGA samples stored in the BMEG system. Here, the user can specify a HUGO
    gene symbol. When the gene is submitted, the TCGA samples are divided into 2 sample groups based on the presence or absence of variant in the specified gene. Next, the BMEG computes the KS distance between the 2 sample groups for each drug
    sensitivity signature. The results are displayed in a table that is sortable and searchable by signature name. There are also links to Wikipedia and Google searches to find more information about a drug.
  </p>
  <center>
    <div id=use_case_2_div>this is use_case_2_div</div>
  </center>
  <p id="queryInfoP"></p>
  <table id="sigResultsTable" class="display" cellspacing="0" width="100%"></table>
  <br>
  <div id="sigBoxPlots"></div>
  <br>
</div>
