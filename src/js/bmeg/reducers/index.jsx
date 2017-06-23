const initialState = {
  searchResults: []
}

const bmeg = (state = initialState, action) => {
  switch (action.type) {
  case 'NEW_SEARCH_RESULTS':
    return Object.assign({}, state, {searchResults: action.results})
  default:
    return state
  }
}

export default bmeg
