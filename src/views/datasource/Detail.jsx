import React from 'react'
import PropTypes from 'prop-types'

import MySQL from './MySQL'
import ODPS from './ODPS'
import SaaS from './SaaS'
import MysoftERP from './MysoftERP'
import API from './API'
import DataHub from './DataHub'

import { DATA_SOURCE_TYPES } from './constants'

import './datasource.less';

const datasourceTypes = {
  MySQL,
  ODPS,
  SaaS,
  MysoftERP,
  API,
  DataHub,
}

const Detail = (props) => {
  if (DATA_SOURCE_TYPES[props.params.type]) {
    const Element = datasourceTypes[DATA_SOURCE_TYPES[props.params.type].name]
    return <Element {...props} />
  }
  return <h2>错误的数据源类型</h2>
}

Detail.propTypes = {
  params: PropTypes.object
}

export default Detail
