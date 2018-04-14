import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class';
import Dialog from 'react-bootstrap-myui/lib/Dialog';

import { DATA_SOURCE_TYPES } from '../constants';

import datasourceErpIcon from '@static/images/datasource/icon-data-erp.png';
import datasourceMysqlIcon from '@static/images/datasource/icon-data-mysql.png';
import datasourceOdpsIcon from '@static/images/datasource/icon-data-odps.png';
import datasourceSaasIcon from '@static/images/datasource/icon-data-saas.png';
import datasourceApiIcon from '@static/images/datasource/icon-data-api.png';
import datasourceDataHubIcon from '@static/images/datasource/icon-data-datahub.png';

const DatasourceAddDialog = createReactClass({
  propTypes: {
    show: PropTypes.bool,
    onSure: PropTypes.func,
    onHide: PropTypes.func
  },

  getDefaultProps() {
    return {
      show: false,
    };
  },

  getInitialState() {
    return {}
  },

  componentDidMount() {
  },

  render() {
    const { show, onHide, onSure } = this.props;

    const datasourceTypes = Object.getOwnPropertyNames(DATA_SOURCE_TYPES).map(key => (
      DATA_SOURCE_TYPES[key]
    ));

    return (
      <Dialog
        show={show}
        onHide={onHide}
        backdrop="static"
        size={{ width: '700px' }}
        className="datasource-add-dialog"
        id="datasource-add-dialog"
      >
        <Dialog.Header closeButton>
          <Dialog.Title>添加数据源</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <div className="select-section" style={this.STYLE_SHEET.selectSection}>
            {
              datasourceTypes.map((item) => {
                const coverStyle = {
                  ...this.STYLE_SHEET.selectItemCover,
                  ...this.STYLE_SHEET[`coverBg${item.type}`]
                };

                return (
                  <div key={`datasource-type-item-${item.type}`}
                    className="select-item"
                    style={this.STYLE_SHEET.selectItem}
                    onClick={() => { onSure(item.type.toLowerCase()) }}
                  >
                    <div className="select-item-cover" style={coverStyle}>
                      <img src={this.DATA_SOURCE_COVERS[`cover${item.type}`]}
                        style={this.STYLE_SHEET.iconImg} />
                    </div>
                    <div className="select-item-text" style={this.STYLE_SHEET.selectItemText}>{item.name}</div>
                  </div>
                )
              })
            }
          </div>
        </Dialog.Body>
      </Dialog>
    );
  },

  DATA_SOURCE_COVERS: {
    coverMysoftERP: datasourceErpIcon,
    coverMySQL: datasourceMysqlIcon,
    coverODPS: datasourceOdpsIcon,
    coverSaaS: datasourceSaasIcon,
    coverAPI: datasourceApiIcon,
    coverDataHub: datasourceDataHubIcon,
  },

  STYLE_SHEET: {
    selectSection: {
      padding: '20px 26px 0px',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between'
    },
    selectItem: {
      width: '80px',
      cursor: 'pointer'
    },
    selectItemCover: {
      width: '100%',
      height: '80px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    coverBgMySQL: {
      backgroundImage: 'linear-gradient(-55deg, #527DFD 0%, #1BA3D8 100%)',
    },
    coverBgODPS: {
      backgroundImage: 'linear-gradient(-45deg, #1FAEC6 0%, #02CEA6 100%)',
    },
    coverBgSaaS: {
      backgroundImage: 'linear-gradient(-60deg, #FA6C47 0%, #FA9D47 100%)',
    },
    coverBgMysoftERP: {
      backgroundImage: 'linear-gradient(-47deg, #1EC558 0%, #D9D22E 100%)',
    },
    coverBgAPI: {
      backgroundImage: 'linear-gradient(-124deg, #1b94e8 0%, #53d9be 100%)',
    },
    coverBgDataHub: {
      backgroundImage: 'linear-gradient(-55deg, #527DFD 0%, #1BA3D8 100%)',
    },
    iconImg: {
      display: 'block',
      width: '40px',
      height: '40px'
    },
    selectItemText: {
      fontSize: '14px',
      lineHeight: '20px',
      paddingTop: '26px',
      height: '46px',
      width: '100%',
      textAlign: 'center'
    }
  },
});

export default DatasourceAddDialog;
