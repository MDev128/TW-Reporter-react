'use strict'

import * as CONSTANTS from '../constants/index'

import { MAX_RESULTS_PER_FETCH, MAX_RESULTS_PER_SEARCH, NUMBER_OF_FIRST_RESPONSE_PAGE, RETURN_DELAY_TIME } from '../constants/authors-list'
import { arrayOf, normalize } from 'normalizr'
import { camelizeKeys } from 'humps'
import fetch from 'isomorphic-fetch'
import get from 'lodash/get'
import omit from 'lodash/omit'

import { InternalServerError } from '../lib/custom-error'
import { author as authorSchema } from '../schemas/index'
import { formatUrl } from '../utils/index'
import { urlParasToString } from '../utils/url-paras-to-string'

const _ = {
  get,
  omit
}

// export function setAuthorsListType(typeOfAuthorsListToRender) {
//   return {
//     type: CONSTANTS.SET_AUTHORS_LIST_TYPE,
//     typeOfAuthorsListToRender
//   }
// }

export function requestSearchAuthors(keywords = '') {
  return {
    type: (keywords === '') ? CONSTANTS.LIST_ALL_AUTHORS_REQUEST : CONSTANTS.SEARCH_AUTHORS_REQUEST,
    keywords: keywords
  }
}

export function failToSearchAuthors(keywords = '', error) {
  return {
    type: (keywords === '') ? CONSTANTS.LIST_ALL_AUTHORS_FAILURE : CONSTANTS.SEARCH_AUTHORS_FAILURE,
    error,
    failedAt: Date.now()
  }
}

export function receiveSearchAuthors({ keywords, responseItems, responseContext }) {
  return {
    type: (keywords === '') ? CONSTANTS.LIST_ALL_AUTHORS_SUCCESS : CONSTANTS.SEARCH_AUTHORS_SUCCESS,
    keywords,
    response: responseItems,
    currentPage: _.get(responseContext, 'page', NUMBER_OF_FIRST_RESPONSE_PAGE - 1),
    totalPages: _.get(responseContext, 'nbPages', 0),
    receivedAt: Date.now()
  }
}

export function searchAuthors({ keywords, targetPage, returnDelay }) {
  return (dispatch, getState) => { // eslint-disable-line no-unused-vars
    const searchParas = {
      keywords,
      filters: 'articlesCount>0',
      hitsPerPage: (keywords === '') ? MAX_RESULTS_PER_FETCH : MAX_RESULTS_PER_SEARCH,
      page: targetPage
    }
    // Trans searchParas object to url parameters:
    let urlParasString = urlParasToString(searchParas)
    let url = formatUrl(`searchAuthors?${urlParasString}`)
    dispatch(requestSearchAuthors(keywords))
    // Call our API server to fetch the data
    return fetch(url)
      .then((response) => {
        if (response.status >= 400) {
          throw new InternalServerError('Bad response from API, response:' + JSON.stringify(response))
        }
        return response.json()
      })
      .then((responseObject) => {
        const items = _.get(responseObject, 'hits', {}) // responseObject.hit
        const responseContext = _.omit(responseObject, 'hits', {})  // All the other things in responseObject except responseObject.hit
        const camelizedJson = camelizeKeys(items)
        const responseItems = normalize(camelizedJson, arrayOf(authorSchema))
        const returnParas = { keywords, responseItems, responseContext }
        // delay for displaying loading spinner
        function delayDispatch() {
          return new Promise((resolve, reject)=> { // eslint-disable-line no-unused-vars
            setTimeout(() => {
              resolve()
            }, returnDelay)
          })
        }
        if (returnDelay > 0) {
          return delayDispatch().then(()=>{
            return dispatch(receiveSearchAuthors(returnParas))
          })
        }
        return dispatch(receiveSearchAuthors(returnParas))
      },
      (error) => {
        return dispatch(failToSearchAuthors(keywords, error))
      })
  }
}

export function searchAuthorsIfNeeded(currentKeywords = '') {
  /* --------- list all authors --------- */ 
  if (currentKeywords === '') {
    return (dispatch, getState) => {
      const currentState = getState()
      const authorsList = _.get(currentState, 'authorsList', {})
      const { isFetching, currentPage, hasMore } = authorsList
      if (currentPage < NUMBER_OF_FIRST_RESPONSE_PAGE) {
        return dispatch(searchAuthors({
          keywords: '',
          targetPage: NUMBER_OF_FIRST_RESPONSE_PAGE,
          returnDelay: 0
        }))
      }
      if (!isFetching && hasMore) {
        return dispatch(searchAuthors({
          keywords: '',
          targetPage: currentPage + 1,
          returnDelay: RETURN_DELAY_TIME
        }))
      }
      return Promise.resolve()
    }
  }
  /* --------- searching authors --------- */ 
  return (dispatch, getState) => {
    const currentState = getState()
    const authorsList = _.get(currentState, 'searchedAuthorsList', {})
    const previousKeywords = _.get(authorsList, 'keywords')
    if ( currentKeywords !== previousKeywords) {
      return dispatch(searchAuthors({
        keywords: currentKeywords,
        targetPage: NUMBER_OF_FIRST_RESPONSE_PAGE,
        returnDelay: 0
      })) 
    }
    return Promise.resolve()
  }
}
