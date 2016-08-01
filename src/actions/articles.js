'use strict'
import { arrayOf, normalize } from 'normalizr'
import { article as articleSchema } from '../schemas/index'
import { camelizeKeys } from 'humps'
import { getArticleEmbeddedQuery } from '../utils/index'
import _ from 'lodash'
import * as articleUtils from '../utils/fetch-articles-funcs'
import * as types from '../constants/action-types'
import { devCatListId, prodCatListId, devTagListId, prodTagListId } from '../conf/list-id'

function requestArticlesByTagId(ids) {
  return {
    type: types.FETCH_ARTICLES_BY_TAG_ID_REQUEST,
    id: _.get(ids, 0)
  }
}

function failToReceiveArticlesByTagId(ids, error) {
  return {
    type: types.FETCH_ARTICLES_BY_TAG_ID_FAILURE,
    id: _.get(ids, 0),
    error,
    failedAt: Date.now()
  }
}

function receiveArticlesByTagId(response, ids) {
  return {
    type: types.FETCH_ARTICLES_BY_TAG_ID_SUCCESS,
    id: _.get(ids, 0),
    response,
    receivedAt: Date.now()
  }
}

function requestArticlesByCatId(ids) {
  return {
    type: types.FETCH_ARTICLES_BY_CAT_ID_REQUEST,
    id: _.get(ids, 0)
  }
}

function failToReceiveArticlesByCatId(ids, error) {
  return {
    type: types.FETCH_ARTICLES_BY_CAT_ID_FAILURE,
    id: _.get(ids, 0),
    error,
    failedAt: Date.now()
  }
}

function receiveArticlesByCatId(response, ids) {
  return {
    type: types.FETCH_ARTICLES_BY_CAT_ID_SUCCESS,
    id: _.get(ids, 0),
    response,
    receivedAt: Date.now()
  }
}

function requestArticlesByTopicId(ids) {
  return {
    type: types.FETCH_ARTICLES_BY_TOPIC_ID_REQUEST,
    id: _.get(ids, 0)
  }
}

function failToReceiveArticlesByTopicId(ids, error) {
  return {
    type: types.FETCH_ARTICLES_BY_TOPIC_ID_FAILURE,
    id: _.get(ids, 0),
    error,
    failedAt: Date.now()
  }
}

function receiveArticlesByTopicId(response, ids) {
  return {
    type: types.FETCH_ARTICLES_BY_TOPIC_ID_SUCCESS,
    id: _.get(ids, 0),
    response,
    receivedAt: Date.now()
  }
}

function requestArticles(ids) {
  return {
    type: types.FETCH_ARTICLES_REQUEST,
    ids
  }
}

function failToReceiveArticles(ids, error) {
  return {
    type: types.FETCH_ARTICLES_FAILURE,
    ids,
    error,
    failedAt: Date.now()
  }
}

function receiveArticles(response, ids) {
  return {
    type: types.FETCH_ARTICLES_SUCCESS,
    ids,
    response,
    receivedAt: Date.now()
  }
}

function _fetchArticles(ids = [], params = {}, isOnlyMeta = true, requestAction, successAction, failAction) {
  return dispatch => {
    dispatch(requestAction(ids))
    return articleUtils.fetchArticles(articleUtils.buildUrl(params, isOnlyMeta ? 'meta' : 'article'))
      .then((response) => {
        let camelizedJson = camelizeKeys(response)
        let normalized = normalize(camelizedJson.items, arrayOf(articleSchema))
        return dispatch(successAction(_.merge(normalized, { links: camelizedJson.links, meta: camelizedJson.meta }), ids))
      }, (error) => {
        return dispatch(failAction(ids, error))
      })
  }
}

function _dedupArticleIds(ids = [], state, isOnlyMeta) {
  const articles = _.get(state, [ 'entities', 'articles' ], {})
  let idsToFetch = []
  for(let id of ids) {
    if (isOnlyMeta) {
      if (!articles.hasOwnProperty(id)) {
        idsToFetch.push(id)
      }
    } else {
      // use content of article to determine if the article is fully fetched or not
      if (!_.get(articles, [ id, 'content' ])) {
        idsToFetch.push(id)
      }
    }
  }
  return idsToFetch

}

function _getListId(target = 'category') {
  if (__DEVELOPMENT__) { // eslint-disable-line
    return target === 'category' ? devCatListId : devTagListId
  }
  return target === 'category' ? prodCatListId : prodTagListId
}

/* Fetch meta of articles by their ids if those are not existed in the state
 * properties of meta: subtitle, name, heroImage, title, topics, publishedDate, slug, links, created and id
 * @param {string[]} ids - article ids to fetch
 * @param {object} params - params for composing query param of api
 * @param {string} [params.sort=-publishedDate] -the way returned articles are sorted by
 * @param {object} params.where - where query param
 * @param {object} params.embedded - embedded query param
 * @param {boolean} isOnlyMeta - if true, only get metadata of articles. Otherwise, get full articles.
 */
export function fetchArticlesByIdsIfNeeded(ids = [], params = {}, isOnlyMeta = true) {
  return (dispatch, getState) => {

    let idsToFetch = _dedupArticleIds(ids, getState(), isOnlyMeta)
    if (idsToFetch.length === 0) {
      return Promise.resolve()
    }

    params = articleUtils.setupWhereParam('_id', idsToFetch, params)
    if (!isOnlyMeta) {
      // add default embedded
      params.embedded = params.embedded ? params.embedded : getArticleEmbeddedQuery()
    }

    return dispatch(_fetchArticles(idsToFetch, params, isOnlyMeta, requestArticles, receiveArticles, failToReceiveArticles))
  }
}

export function fetchArticlesByTopicIdIfNeeded(topicId = '', params = {}, isOnlyMeta = true)  {
  return (dispatch, getState) => {
    if (_.get(getState(), [ 'entities', 'articlesByTopics', topicId ])) {
      return Promise.resolve()
    }

    params = articleUtils.setupWhereParam('topics', [ topicId ], params)
    if (!isOnlyMeta) {
      // add default embedded
      params.embedded = params.embedded ? params.embedded : getArticleEmbeddedQuery()
    }

    return dispatch(_fetchArticles([ topicId ], params, isOnlyMeta, requestArticlesByTopicId, receiveArticlesByTopicId, failToReceiveArticlesByTopicId))
  }
}

export function fetchArticlesByTagIdIfNeeded(tagId = '', params = {}, isOnlyMeta = true) {
  return (dispatch, getState) => {
    let items = _.get(getState(), [ 'entities', 'articleByTags', tagId, 'items' ])

    if (items.length >= params.max_results * params.page) {
      return Promise.resolve()
    }

    params = articleUtils.setupWhereParam('tags', [ tagId ], params)
    if (!isOnlyMeta) {
      // add default embedded
      params.embedded = params.embedded ? params.embedded : getArticleEmbeddedQuery()
    }

    return dispatch(_fetchArticles([ tagId ], params, isOnlyMeta, requestArticlesByTagId, receiveArticlesByTagId, failToReceiveArticlesByTagId))
  }
}

export function fetchArticlesByCatIdIfNeeded(catId = '', params = {}, isOnlyMeta = true) {
  return (dispatch, getState) => {
    let items = _.get(getState(), [ 'entities', 'articleByCats', catId, 'items' ])

    if (items.length >= params.max_results * params.page) {
      return Promise.resolve()
    }

    params = articleUtils.setupWhereParam('categories', [ catId ], params)
    if (!isOnlyMeta) {
      // add default embedded
      params.embedded = params.embedded ? params.embedded : getArticleEmbeddedQuery()
    }

    return dispatch(_fetchArticles([ catId ], params, isOnlyMeta, requestArticlesByCatId, receiveArticlesByCatId, failToReceiveArticlesByCatId))
  }
}


export function fetchArticlesByTopicIdNameIfNeeded(topicName = '', params = {} , isOnlyMeta = true) {
  let listId = _getListId()
  let topicId = listId[topicName]
  return fetchArticlesByTopicIdIfNeeded(topicId, params, isOnlyMeta)
}

function _fetchArticlesByName(name = '', params = {}, isOnlyMeta = true, target) {
  let listId = _getListId(target)
  let id = listId[name]
  params = params || {}
  params.max_results = params.max_results || 10
  params.page = params.page || 1
  return target === 'category' ? fetchArticlesByCatIdIfNeeded(id, params, isOnlyMeta) : fetchArticlesByTagIdIfNeeded(id, params, isOnlyMeta)
}

export function fetchArticlesByCatNameIfNeeded(catName = '', params = {}, isOnlyMeta = true) {
  return _fetchArticlesByName(catName, params, isOnlyMeta, 'category')
}

export function fetchArticlesByTagNameIfNeeded(tagName = '', params = {}, isOnlyMeta = true) {
  return _fetchArticlesByName(tagName, params, isOnlyMeta, 'tag')
}

