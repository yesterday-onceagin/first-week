import React from 'react'
import PropTypes from 'prop-types'
import AuthComponent from '@components/AuthComponent'
// 各类数据源默认封面
import coverBgSaaS from '@static/images/datasource/cover-saas.jpg'
import coverBgODPS from '@static/images/datasource/cover-odps.jpg'
import coverBgMysoftERP from '@static/images/datasource/cover-erp.jpg'
import coverBgMySQL from '@static/images/datasource/cover-mysql.jpg'
import coverBgAPI from '@static/images/datasource/cover-api.jpg'
import coverBgDatahub from '@static/images/datasource/cover-datahub.jpg'

class DataSourceItem extends React.Component {
  static propTypes = {
    style: PropTypes.object,
    className: PropTypes.string,
    onDel: PropTypes.func,
    onEdit: PropTypes.func,
    item: PropTypes.object,
    isAdd: PropTypes.bool,
    onAdd: PropTypes.func
  };

  render() {
    const { className, onEdit, onDel, item, isAdd, onAdd, style } = this.props;

    const coverUrl = item ? (item.icon || this.defaultCover[item.type]) : null;

    return (
      <div className={`data-source-item ${className || ''}`} style={{
        ...style,
        ...this.STYLE_SHEET.container,
        margin: '0 25px 25px 0'
      }}>
        {
          isAdd ? (
            <div className="datasource-add-box" style={this.STYLE_SHEET.add} onClick={onAdd}>
              <i className="dmpicon-add" style={this.STYLE_SHEET.addIcon} />
              <div className="datasource-add-text" style={this.STYLE_SHEET.addText}>
                添加数据源
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%' }}>
              <div style={this.STYLE_SHEET.data} className="data-source-item-data">
                <div className="data-source-item-imgbox" style={{
                  ...this.STYLE_SHEET.dataBg,
                  backgroundImage: `url(${coverUrl}?x-oss-process=image/resize,m_fixed,h_170,w_120)`
                }} />
                <div className="data-source-item-action" style={this.STYLE_SHEET.dataAction}>
                  <button type="button" className="data-source-item-btn circle-btn" onClick={onEdit}>
                    <i className="dmpicon-edit" />
                  </button>
                  <AuthComponent pagecode='添加数据源' visiblecode="edit">
                    <button type="button" className="data-source-item-btn circle-btn" onClick={onDel}>
                      <i className="dmpicon-del" />
                    </button>
                  </AuthComponent>
                </div>
              </div>
              <div style={this.STYLE_SHEET.nameText} className="data-source-item-name">
                {item && item.name}
              </div>
              <div style={this.STYLE_SHEET.des} className="data-source-item-des">
                <span style={this.STYLE_SHEET.type} className="data-source-item-type">
                  {item && item.type}
                </span>
                <span style={this.STYLE_SHEET.time} className="data-source-item-time">
                  {item && item.modified_on && item.modified_on.split('T')[0]}
                </span>
              </div>
            </div>
          )
        }
      </div>
    )
  }

  defaultCover = {
    SaaS: coverBgSaaS,
    ODPS: coverBgODPS,
    MysoftERP: coverBgMysoftERP,
    MySQL: coverBgMySQL,
    API: coverBgAPI,
    DataHub: coverBgDatahub,
  };

  // 除 hover、theme以外的样式
  STYLE_SHEET = {
    container: {
      width: '200px',
      height: '220px',
      padding: '14px',
      transition: 'border-color .3s',
      position: 'relative',
      borderWidth: '1px',
      borderStyle: 'solid'
    },
    add: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      transition: 'color .3s',
      cursor: 'pointer'
    },
    addIcon: {
      fontSize: '50px',
      display: 'block'
    },
    addText: {
      fontSize: '16px',
      lineHeight: '22px',
      paddingTop: '15px'
    },
    data: {
      width: '100%',
      height: '120px',
      position: 'relative',
      overflow: 'hidden'
    },
    dataBg: {
      width: '100%',
      height: '100%',
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '100% 100%',
      transition: 'all .3s'
    },
    dataAction: {
      width: '100%',
      height: '100%',
      position: 'absolute',
      left: 0,
      top: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      transition: 'opacity .3s'
    },
    nameText: {
      width: '100%',
      height: '50px',
      lineHeight: '22px',
      padding: '18px 20px 10px 0',
      fontSize: '16px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    des: {
      position: 'absolute',
      left: 0,
      bottom: 0,
      height: '35px',
      width: '100%',
      lineHeight: '35px',
      fontSize: '12px',
      padding: '0 14px'
    },
    type: {
      float: 'left'
    },
    time: {
      float: 'right'
    }
  }
}

export default DataSourceItem
