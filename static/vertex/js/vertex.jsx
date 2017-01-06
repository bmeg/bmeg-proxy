var snipPrefix = function(s) {
  return s.substring(s.indexOf(':') + 1);
}

function VertexEdge(props) {
  return <li><a onClick={props.onClick}>{snipPrefix(props.gid)}</a></li>
}


var VertexEdges = React.createClass({
  getInitialState: function() {
    return {};
  },

  render: function() {
    var edges = this;
    var edgeList = this.props.edges.map(function(edge) {
      return <VertexEdge
        key={edge}
        gid={edge}
        onClick={() => edges.props.navigate(edge)}
      />
    })

    var prefix = this.props.edges[0].split(':')[0]

    return (
      <div>
        <h4>{this.props.label} ({this.props.direction} {prefix})</h4>
        <ul>
          {edgeList}
        </ul>
      </div>
    );
  }
});


function PropertyRow(props) {
  return (<tr>
    <td className="prop-key mdl-data-table__cell--non-numeric">{props.name}</td>
    <td className="mdl-data-table__cell--non-numeric">{props.value}</td>
  </tr>)
}

var VertexView = React.createClass({
  getInitialState: function() {
    return {}
  },

  render: function() {
    var props = this.props;

    var properties = Object.keys(props.vertex.properties).map(function(key) {
      var v = props.vertex.properties[key];
      return <PropertyRow key={key} name={key} value={v} />
    });

    var inEdges = Object.keys(props.vertex['in']).map(function(key) {
      return <VertexEdges
        key={key}
        label={key}
        navigate={props.navigate}
        edges={props.vertex['in'][key]}
        direction="from"
      />
    });

    var outEdges = Object.keys(props.vertex['out']).map(function(key) {
      return <VertexEdges
        key={key}
        label={key}
        navigate={props.navigate}
        edges={props.vertex['out'][key]}
        direction="to"
      />
    });

    return (
      <div>
        <div className="vertex-properties">
          <table
            className="prop-table mdl-data-table mdl-js-data-table mdl-data-table--selectable mdl-shadow--2dp"
          ><tbody>
            {properties}
          </tbody></table>
        </div>
        <div className="vertex-in-edges">
          <h3>In Edges</h3>
          {inEdges}
        </div>
        <div className="vertex-out-edges">
          <h3>Out Edges</h3>
          {outEdges}
        </div>
      </div>
    )
  }
});


var VertexInput = React.createClass({
  componentDidMount() {
    componentHandler.upgradeElement(this.refs.mdlWrapper)
  },
  render() {
    return <div
      className="mdl-textfield mdl-js-textfield mdl-textfield--floating-label"
      ref="mdlWrapper"
    >
      <label
        className="mdl-textfield__label"
        htmlFor="vertex-gid-input"
      >Enter a vertex GID</label>
      <input
        id="vertex-gid-input"
        type="text"
        name="gid"
        className="mdl-textfield__input"
        onChange={e => this.props.onChange(e.target.value)}
        value={this.props.value}
      />
    </div>
  },
})

var VertexViewer = React.createClass({
  getInitialState: function() {
    return {
      input: this.getVertexFromHash(),
      loading: false,
      error: "",
      vertex: {},
    };
  },

  getVertexFromHash() {
    return window.location.hash.substr(1);
  },

  componentDidMount() {
    window.onpopstate = this.onPopState
    if (this.state.input) {
      this.setVertex(this.state.input, true)
    }
  },

  onPopState(e) {
    var hash = this.getVertexFromHash();
    if (e.state && e.state.gid) {
      this.setVertex(e.state.gid, true)
    } else if (hash) {
      this.setVertex(hash, true)
    } else {
      this.setVertex()
    }
  },

  setVertex(gid, nopushstate) {
    if (!gid) {
      this.setState({vertex: {}, error: ""})
    } else {
      var url = "/gaia/vertex/find/" + gid;
      this.setState({input: gid, loading: true, error: ""});
      $.ajax({
        url: url,
        dataType: 'json',
        type: 'GET',
        success: result => {
          if (Object.keys(result).length > 0) {
            this.setState({vertex: result, loading: false, error: ""})
            if (!nopushstate) {
              // Only push state to history if we found an actual vertex
              // This avoids pushing state for intermediate queries.
              history.pushState({gid: gid}, "Vertex: " + gid, '#' + gid);
            }
          } else {
            this.setState({vertex: {}, loading: false, error: ""})
          }
        },
        error: (xhr, status, err) => {
          this.setState({loading: false, error: err.toString()})
          console.error(url, status, err.toString())
        },
        timeout: 3000,
      });
    }
  },

  render: function() {
    var loading = "";
    if (this.state.loading) {
      loading = <div className="mdl-spinner mdl-js-spinner is-active"></div>
    }

    var error;
    if (this.state.error) {
      error = <div>Request error: {this.state.error}</div>
    }

    var emptyMessage = "";
    if (this.state.input) {
      emptyMessage = "No vertex found";
    }
    var vertex = <div className="empty-vertex">{emptyMessage}</div>;

    // The vertex isn't empty, so create a VertexView
    if (this.state.vertex.properties) {
      vertex = <VertexView
        navigate={this.setVertex}
        vertex={this.state.vertex}
      />
    }

    return (
      <div>
        <VertexInput onChange={this.setVertex} value={this.state.input} />
        {loading}
        {error}
        {vertex}
      </div>
    );
  }
});

window.addEventListener('load', function() {
  ReactDOM.render(<VertexViewer />, document.getElementById('vertex-explore'));
})
