import React from 'react'
import PropTypes from 'prop-types'

import Select from 'react-bootstrap-myui/lib/Select'
import Input from 'react-bootstrap-myui/lib/Input'
import NumberInput from '@components/NumberInput'
import SwitchButton from '@components/SwitchButton'
import BackgroundUploader from './BackgroundUploader'
import ColorOptionColumn from './ColorOptionColumn'
import SelectorDialog from './SelectorDialog'
import DataSetConfig from './dataSetConfig/DataSetConfig'

import classnames from 'classnames'
import _ from 'lodash'
import { getDashboardLayoutOptions } from '@helpers/dashboardUtils'
import { SELECTOR_CHART_TYPE } from '../constants/incOption'
import { SIMPLE_TYPES, FILTER_TYPES } from '@constants/dashboard'
import { APPLICATION_PLATFORMS } from '@constants/dmp'

import './layout-config-panel.less'

class LayoutConfigPanel extends React.Component {
  static propTypes = {
    show: PropTypes.bool.isRequired,
    dashboardData: PropTypes.object.isRequired,
    reportDatasetId: PropTypes.string,
    dashboardId: PropTypes.string,
    diagramList: PropTypes.array,
    gridLayout: PropTypes.array,
    onUpload: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    onReportDataSetChange: PropTypes.func,   //数据集变化
    onChangeSelector: PropTypes.func.isRequired,
    onConfirmChange: PropTypes.func.isRequired,
    onScreenshot: PropTypes.func.isRequired,
    showSucc: PropTypes.func.isRequired,
    showErr: PropTypes.func.isRequired,
    isdevtools: PropTypes.bool
  };

  static defaultProps = {
    show: false,
    dashboardData: {},
  };

  constructor(props) {
    super(props);
    const dashboardData = props.dashboardData || {}
    const _layoutOpts = getDashboardLayoutOptions(dashboardData)
    this.state = {
      ..._layoutOpts,
      cover: dashboardData.cover || '',
      coverPending: false,
      configGroupShow: {
        layout: 1,
        select: 1,
        background: 1,
        cover: 1,
        scaleMode: 1
      },
      tabStatus: 'style', //当前tab选中项
      selectorDialogShow: false,
      selectorContainer: {},                    // 存储可设置联动图表之间的联动对应关系(但是需要勾选才能联动)， id: [list]
      diagramList: this.diagramFilter(props.diagramList),     //
      uploaderUuid: new Date().getTime(),       // 图片上传组件的uuid
    };
    // 暴露获取layout设置的方法
    this.getDesignOption = this._getDesignOption.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const dashboardData = nextProps.dashboardData || {}
    if (!_.isEqual(this.props.dashboardData, dashboardData) && dashboardData) {
      const _layoutOpts = getDashboardLayoutOptions(dashboardData)
      const _cover = dashboardData.cover || ''
      this.setState({
        ..._layoutOpts,
        cover: _cover,
        uploaderUuid: new Date().getTime()
      })
    }
    //如果diagramList发生变化
    if (nextProps.diagramList && !_.isEqual(this.props.diagramList, nextProps.diagramList)) {
      const diagramList = this.diagramFilter(nextProps.diagramList)
      this.setState({
        diagramList
      }, () => {
        this.diagramTriggeredFilter(nextProps.diagramList)
      })
    }
  }

  render() {
    const { show, isdevtools, reportDatasetId, onReportDataSetChange } = this.props;
    const { tabStatus, dashboard_filters } = this.state
    return show && (
      <div className="dataview-design-panel diagram-config-panel" ref={(instance) => {
        this.dataviewDesignPanel = instance;
      }}>
        <div style={this.STYLE_SHEET.chartName}>
          <div style={{ textAlign: 'center' }}>
            报告配置
          </div>
        </div>
        <div className="edit-tab">
          <div className="edit-tab-wrap">
            {
              !isdevtools ? (
                <ul className="edit-tab-nav">
                  <li className={tabStatus === 'style' ? 'active' : ''}
                    onClick={this.handleChangeTabStatus.bind(this, 'style')}
                  >
                    样式
                  </li>
                  <li className={tabStatus === 'dataset' ? 'active' : ''}
                    onClick={this.handleChangeTabStatus.bind(this, 'dataset')}
                  >
                    数据
                  </li>
                </ul>
              ) : null
            }

            {
              tabStatus === 'style' ? (
                <div style={{ overflowY: 'scroll' }}>
                  {this.renderStyleSheet()}
                </div>
              ) : (
                <DataSetConfig
                  type='report_config'
                  reportSelectors={dashboard_filters}
                  dashboardId={this.props.dashboardId}
                  currentSource={reportDatasetId}
                  onDatasetChange={onReportDataSetChange}
                />
              )
            }
          </div>
        </div>
      </div>
    )
  }

  // 渲染页面样式总入口
  renderStyleSheet() {
    const { isdevtools } = this.props
    const { configGroupShow, background } = this.state;
    return (
      <div className="design-config-group">
        <div className="design-config-title"
          style={this.STYLE_SHEET.title}
          onClick={this.handleChangeConfigGroupShow.bind(this, 'layout')}
        >
          <i className="spread-icon dmpicon-arrow-down" style={{
            ...this.STYLE_SHEET.spreadIcon,
            transform: !configGroupShow.layout ? 'scale(0.75) translateY(-50%) rotateZ(-90deg)' : 'scale(0.75) translateY(-50%)'
          }} />
          页面设置
        </div>
        {this.renderPageLayoutOptions()}


        {!isdevtools ? <div className="design-config-title"
          style={this.STYLE_SHEET.title}
          onClick={this.handleChangeConfigGroupShow.bind(this, 'scaleMode')}
        >
          <i className="spread-icon dmpicon-arrow-down" style={{
            ...this.STYLE_SHEET.spreadIcon,
            transform: !configGroupShow.scaleMode ? 'scale(0.75) translateY(-50%) rotateZ(-90deg)' : 'scale(0.75) translateY(-50%)'
          }} />
          缩放模式
        </div> : null}
        {!isdevtools && this.renderScaleModeOptions()}

        {!isdevtools ? <div className="design-config-title"
          style={this.STYLE_SHEET.title}
          onClick={this.handleChangeConfigGroupShow.bind(this, 'select')}
        >
          <i className="spread-icon dmpicon-arrow-down" style={{
            ...this.STYLE_SHEET.spreadIcon,
            transform: !configGroupShow.select ? 'scale(0.75) translateY(-50%) rotateZ(-90deg)' : 'scale(0.75) translateY(-50%)'
          }} />
          联动设置
        </div> : null}
        {!isdevtools && this.renderSelectOptions()}

        {!isdevtools ? <div className="design-config-title"
          style={this.STYLE_SHEET.title}
          onClick={this.handleChangeConfigGroupShow.bind(this, 'background')}
        >
          <i className="spread-icon dmpicon-arrow-down" style={{
            ...this.STYLE_SHEET.spreadIcon,
            transform: !configGroupShow.background ? 'scale(0.75) translateY(-50%) rotateZ(-90deg)' : 'scale(0.75) translateY(-50%)'
          }} />
          背景
          <SwitchButton
            active={background.show}
            turnOn={this.handleChangeShowBg.bind(this, true)}
            turnOff={this.handleChangeShowBg.bind(this, false)}
            style={this.STYLE_SHEET.switchBtn}
            activeStyle={this.STYLE_SHEET.switchBtn}
            circleStyle={{ width: '14px', height: '14px', top: 0, left: 0 }}
            circleActiveStyle={{ width: '14px', height: '14px', top: 0, left: '20px' }}
            texts={null}
          />
        </div> : null}
        {!isdevtools && this.renderBackgroundOptions()}

        {!isdevtools ? <div className="design-config-title"
          style={this.STYLE_SHEET.title}
          onClick={this.handleChangeConfigGroupShow.bind(this, 'cover')}
        >
          <i className="spread-icon dmpicon-arrow-down" style={{
            ...this.STYLE_SHEET.spreadIcon,
            transform: !configGroupShow.cover ? 'scale(0.75) translateY(-50%) rotateZ(-90deg)' : 'scale(0.75) translateY(-50%)'
          }} />
          封面
        </div> : null}
        {!isdevtools && this.renderCoverOptions()}
      </div>
    )
  }
  // 渲染页面设置区域的内容
  renderPageLayoutOptions() {
    const { layout, configGroupShow, platform } = this.state;
    // 是否为自定义比例
    const isFreeRatio = layout.ratio === 'free'
    // 是否为移动端
    const isMobile = platform === 'mobile'
    // 高度输入框的className
    const heightInputClass = classnames('layout-config-column', {
      disabled: !isFreeRatio || isMobile
    })
    // 其他行的className
    const normalColumnClass = classnames('layout-config-column', {
      disabled: isMobile
    })

    return (
      <div className="design-config-content" style={{
        ...this.STYLE_SHEET.groupCommon,
        height: configGroupShow.layout ? 'auto' : 0,
        borderBottomWidth: configGroupShow.layout ? 1 : 0,
        padding: configGroupShow.layout ? '10px 14px 0 33px' : '0 14px 0 33px',
        overflow: configGroupShow.layout ? 'visible' : 'hidden'
      }}>
        <div className="layout-config-column" style={this.STYLE_SHEET.configColumn}>
          <span style={this.STYLE_SHEET.configColumnTitle}>平台</span>
          <span style={this.STYLE_SHEET.selectText}>
            {isMobile ? APPLICATION_PLATFORMS.mobile.name : APPLICATION_PLATFORMS.pc.name}
          </span>
          <Select value={platform || 'pc'}
            maxHeight={100}
            width="100%"
            openSearch={false}
            onSelected={this.handleChangePlatform.bind(this)}
          >
            <option value="pc">PC端</option>
            <option value="mobile">移动端</option>
          </Select>
        </div>

        <div className={normalColumnClass} style={this.STYLE_SHEET.configColumn}>
          <span style={this.STYLE_SHEET.configColumnTitle}>类型</span>
          <span style={this.STYLE_SHEET.selectText}>
            {layout.ratio === '16:9' ? '16 : 9' : (layout.ratio === '4:3' ? '4 : 3' : '自定义')}
          </span>
          <Select value={layout.ratio}
            maxHeight={100}
            width="100%"
            openSearch={false}
            disabled={isMobile}
            onSelected={this.handleChangeLayoutRatio.bind(this)}
          >
            <option value="16:9">16 : 9</option>
            <option value="4:3">4 : 3</option>
            <option value="free">自定义</option>
          </Select>
        </div>

        <div className={normalColumnClass} style={{
          ...this.STYLE_SHEET.configColumn,
          padding: '0 26px 10px 94px'
        }}>
          <span style={this.STYLE_SHEET.configColumnTitle}>宽度</span>
          <span style={this.STYLE_SHEET.pxUnit}>px</span>
          <NumberInput
            changeOnBlur={true}
            debounce={true}
            minValue={320}
            step={10}
            name="layout-config-size-width"
            disabled={isMobile}
            value={+layout.width}
            onChange={this.handleChangeInput.bind(this, 'layout', 'width')}
          />
        </div>

        <div className={heightInputClass} style={{
          ...this.STYLE_SHEET.configColumn,
          padding: '0 26px 10px 94px'
        }}>
          <span style={this.STYLE_SHEET.configColumnTitle}>高度</span>
          <span style={this.STYLE_SHEET.pxUnit}>px</span>
          <NumberInput
            changeOnBlur={true}
            debounce={true}
            minValue={160}
            step={10}
            name="layout-config-size-height"
            disabled={!isFreeRatio || isMobile}
            value={layout.height}
            onChange={this.handleChangeInput.bind(this, 'layout', 'height')}
          />
        </div>
      </div>
    )
  }

  renderScaleModeOptions() {
    const { configGroupShow, scale_mode } = this.state
    return (
      <div className="design-config-content" style={{
        ...this.STYLE_SHEET.groupCommon,
        height: configGroupShow.scaleMode ? 'auto' : 0,
        borderBottomWidth: configGroupShow.scaleMode ? 1 : 0,
        padding: configGroupShow.scaleMode ? '0 14px 10px 33px' : '0 14px 0 33px',
        overflow: configGroupShow.scaleMode ? 'visible' : 'hidden'
      }}>
        <div className="layout-config-column" style={{
          ...this.STYLE_SHEET.configColumn
        }}>
          <span style={this.STYLE_SHEET.configColumnTitle}>
            <Input
              type="radio"
              value={0}
              checked={scale_mode === 0}
              label='等比缩放宽度铺满'
              onChange={this.handleChangeScaleMode.bind(this, 0)}
            />
          </span>
        </div>
        <div className="layout-config-column" style={{
          ...this.STYLE_SHEET.configColumn
        }}>
          <span style={this.STYLE_SHEET.configColumnTitle}>
            <Input
              type="radio"
              value={2}
              checked={scale_mode === 2}
              label='全屏铺满'
              onChange={this.handleChangeScaleMode.bind(this, 2)}
            />
          </span>
        </div>
      </div>
    )
  }

  //渲染自定义联动、全局联动设置
  renderSelectOptions() {
    const { configGroupShow, type, selectors, selectorDialogShow, diagramList, selectorContainer } = this.state
    return (
      <div className="design-config-content" style={{
        ...this.STYLE_SHEET.groupCommon,
        height: configGroupShow.select ? 'auto' : 0,
        borderBottomWidth: configGroupShow.select ? 1 : 0,
        padding: configGroupShow.select ? '0 14px 10px 33px' : '0 14px 0 33px',
        overflow: configGroupShow.select ? 'visible' : 'hidden'
      }}>
        <div className="layout-config-column" style={{
          ...this.STYLE_SHEET.configColumn
        }}>
          <span style={this.STYLE_SHEET.configColumnTitle}>
            <Input
              type="radio"
              value='global'
              checked={type === 'global'}
              onChange={this.handleChangeSelectorType.bind(this)}
              label='全局联动'
            />
          </span>
        </div>
        <div className="layout-config-column" style={{
          ...this.STYLE_SHEET.configColumn
        }}>
          <span style={this.STYLE_SHEET.configColumnTitle}>
            <Input
              type="radio"
              value='custom'
              checked={type === 'custom'}
              onChange={this.handleChangeSelectorType.bind(this)}
              label='自定义联动'
            />
          </span>
          {
            type === 'custom' && <span style={this.STYLE_SHEET.customSelectEdit}>
              <i className="dmpicon-edit"
                style={{ cursor: 'pointer' }}
                onClick={this.handleOpenSelectorDialog.bind(this)}
              />
            </span>
          }
          {
            selectorDialogShow && <SelectorDialog
              show={selectorDialogShow}
              onClose={this.handleCloseSelectorDialog.bind(this)}
              onSure={this.handleSureSelectorDialog.bind(this)}
              diagramList={diagramList}
              selectorList={selectors}
              selectorContainer={selectorContainer}
            />
          }
        </div>
      </div>
    )
  }

  // 渲染背景设置区域的内容
  renderBackgroundOptions() {
    const {
      background,
      configGroupShow,
      uploaderUuid
    } = this.state

    const clsName = classnames('layout-config-column', {
      disabled: !background.show
    })

    const showContent = configGroupShow.background && background.show

    return (
      <div className="design-config-content" style={{
        ...this.STYLE_SHEET.groupCommon,
        height: showContent ? 'auto' : 0,
        borderBottomWidth: showContent ? 1 : 0,
        padding: showContent ? '10px 14px 0 33px' : '0 14px 0 33px',
        overflow: showContent ? 'visible' : 'hidden',
      }}>
        <div className={clsName} style={this.STYLE_SHEET.configColumn}>
          <span style={this.STYLE_SHEET.configColumnTitle}>背景颜色</span>
          <ColorOptionColumn
            onChange={this.handleConfirmColorChange.bind(this, 'background')}
            field="color"
            color={background.color}
          />
        </div>

        <div className={clsName} style={this.STYLE_SHEET.configColumn}>
          <span style={this.STYLE_SHEET.configColumnTitle}>背景图片</span>
          <BackgroundUploader
            uuid={uploaderUuid}
            height={30}
            defaultURI={background.image}
            mbSize={2}
            imgText="背景图片"
            onUpload={this.props.onUpload}
            onSuccess={this.handleUploadImgSuccess.bind(this)}
            onFailure={this.handleUploadImgFailure.bind(this)}
            onCancel={this.handleDeleteUploadImg.bind(this)}
          />
        </div>
        {
          background.image && (
            <div className={clsName} style={{
              ...this.STYLE_SHEET.configColumn,
              height: '40px',
              padding: '0 0 10px 94px'
            }}>
              <span style={this.STYLE_SHEET.configColumnTitle}>填充类型</span>
              <span style={this.STYLE_SHEET.selectText}>
                {background.size === 'tile' ? '平铺' : (background.size === 'center' ? '居中' : '拉伸')}
              </span>
              <Select value={background.size}
                maxHeight={100}
                width="100%"
                openSearch={false}
                onSelected={this.handleChangeBackgroundImageSize.bind(this)}
              >
                <option value="stretch">拉伸</option>
                <option value="tile">平铺</option>
                <option value="center">居中</option>
              </Select>
            </div>
          )
        }
      </div>
    );
  }

  // 渲染封面设置区域的内容
  renderCoverOptions() {
    const {
      cover,
      coverPending,
      configGroupShow
    } = this.state

    const coverBtnClass = classnames('layout-config-cover-btn', {
      disabled: coverPending
    })

    return (
      <div className="design-config-content" style={{
        ...this.STYLE_SHEET.groupCommon,
        height: configGroupShow.cover ? 'auto' : 0,
        borderBottomWidth: configGroupShow.cover ? 1 : 0,
        padding: configGroupShow.cover ? '10px 14px 0 33px' : '0 14px 0 33px',
        overflow: configGroupShow.cover ? 'visible' : 'hidden',
      }}>
        <div className="layout-config-column" style={{
          ...this.STYLE_SHEET.configColumn,
          height: '174px'
        }}>
          <span style={this.STYLE_SHEET.configColumnTitle}>封面</span>
          <div className={coverBtnClass} onClick={this.handleGetDashboardImage.bind(this)}>
            <i className="dmpicon-shot" style={{ fontSize: '15px', position: 'relative', top: '2px' }} />
            截取封面
          </div>
          <div className="layout-config-cover-preview">
            {
              coverPending && (
                <div className="layout-config-cover-loading">
                  <span className="fontelloicon glyphicon-spinner" />
                </div>
              )
            }
            {cover && <img src={`${cover}?x-oss-process=image/resize,m_mfit,h_128,w_205/crop,h_128,w_205`} />}
          </div>
        </div>
      </div>
    );
  }

  // 打开联动配置对话框
  handleOpenSelectorDialog() {
    this.setState({
      selectorDialogShow: true
    })
  }

  // 确认联动配置
  handleSureSelectorDialog(list) {
    // 先关闭对话框
    this.handleCloseSelectorDialog()
    this.props.onChangeSelector('custom', list)
  }

  // 关闭联动配置对话框
  handleCloseSelectorDialog() {
    this.setState({
      selectorDialogShow: false
    })
  }

  // 切换联动类型
  handleChangeSelectorType(e) {
    const { value } = e.target
    // 如果从全局切换到自定义
    if (value === 'global') {
      this.props.onConfirmChange(() => {
        this.props.onChangeSelector('global', value)
      })
    } else {
      this.setState({
        selectorDialogShow: true
      })
    }
  }

  // 更新缩放模式
  handleChangeScaleMode(type) {
    this.setState({
      scale_mode: type
    })
    this.props.onChange({ scale_mode: type })
  }

  // 获取报告截图
  handleGetDashboardImage() {
    if (this.state.coverPending) {
      return
    }
    this.props.onScreenshot(this._coverUploadStart.bind(this), this._coverUploadSucc.bind(this), this._coverUploadFailure.bind(this))
  }

  // 修改是否显示背景
  handleChangeShowBg(show, e) {
    if (e && e.stopPropagation) {
      e.stopPropagation()
    }
    this.setState(preState => ({
      background: {
        ...preState.background,
        show
      }
    }))
    // 通知报告页面
    this.props.onChange({
      background: { show }
    });
  }

  // 上传背景图片成功
  handleUploadImgSuccess(data) {
    this.props.showSucc(data.msg);
    this.setState(preState => ({
      background: {
        ...preState.background,
        image: data.data
      },
      uploaderUuid: new Date().getTime()
    }));
    // 通知报告页面
    this.props.onChange({
      background: {
        image: data.data
      }
    });
  }

  // 上传背景图片失败
  handleUploadImgFailure(errMsg) {
    this.props.showErr(errMsg);
    this.setState({
      uploaderUuid: new Date().getTime()
    });
  }

  // 撤销上传的背景图片
  handleDeleteUploadImg() {
    this.setState(preState => ({
      background: {
        ...preState.background,
        image: ''
      },
      uploaderUuid: new Date().getTime()
    }));
    // 通知报告页面
    this.props.onChange({
      background: {
        image: ''
      }
    });
  }

  // 确定颜色选择
  handleConfirmColorChange(type, field, color) {
    this.setState(preState => ({
      [type]: {
        ...preState[type],
        [field]: color,
      }
    }))
    // 通知到页面
    this.props.onChange({
      [type]: {
        [field]: color
      }
    });
  }

  // 切换背景图填充方式
  handleChangeBackgroundImageSize(opts) {
    if (this.state.background.size === opts.value) {
      return;
    }

    this.setState(preState => ({
      background: {
        ...preState.background,
        size: opts.value
      }
    }))
    // 通知到页面
    this.props.onChange({
      background: {
        size: opts.value
      }
    });
  }

  // 设置页面设置的尺寸
  handleChangeInput(group, field, value) {
    const options = {
      [field]: value
    };

    const { ratio } = this.state.layout;
    // 如果是页面设置并且比例为非自由模式
    if (group === 'layout' && ratio !== 'free') {
      const r = ratio.split(':');
      if (field === 'width') {
        options.height = Math.ceil(r[1] * value / r[0]);
      } else if (field === 'height') {
        options.width = Math.ceil(r[0] * value / r[1]);
      }
    }

    this.setState(preState => ({
      [group]: {
        ...preState[group],
        ...options
      }
    }))

    // 通知到页面
    this.props.onChange({ [group]: options });
  }

  // 切换平台类型
  handleChangePlatform(opts) {
    if (this.state.layout.platform === opts.value) {
      return
    }

    const { gridLayout, onChange } = this.props
    const newPlatform = opts.value
    const options = {
      platform: newPlatform,
      layout: {}
    }
    // 如果由其他改成移动端
    if (newPlatform === 'mobile') {
      options.layout.ratio = 'free'
      options.layout.width = 750
      // 记录最大高度值
      let maxHeight = 0
      // 重排单图位置并调整大小
      gridLayout.forEach((item) => {
        const currH = (+item.h) + (+item.y) - 4
        maxHeight = currH > maxHeight ? currH : maxHeight
      })
      // 处理高度为最大高度
      options.layout.height = Math.ceil(maxHeight > 500 ? maxHeight : 500)
    }
    if (newPlatform === 'mobile') {
      this.setState(preState => ({
        platform: newPlatform,
        layout: {
          ...preState.layout,
          ...options.layout
        }
      }))
    } else {
      this.setState({ platform: newPlatform })
    }
    // 通知到外部
    onChange(options)
  }

  // 切换页面设置中的显示比例（类型）
  handleChangeLayoutRatio(opts) {
    if (this.state.layout.ratio === opts.value) {
      return;
    }
    // 新的比例
    const options = {
      ratio: opts.value
    };
    // 如果不是切换到自定义比例 计算出应调整的高度
    if (options.ratio !== 'free') {
      const r = options.ratio.split(':');
      options.height = Math.floor(r[1] * this.state.layout.width / r[0]);
    }

    this.setState({
      layout: {
        ...this.state.layout,
        ...options
      }
    });
    // 通知到页面
    this.props.onChange({ layout: options });
  }

  // 切换设置群组显示状态
  handleChangeConfigGroupShow(groupType) {
    this.setState({
      configGroupShow: {
        ...this.state.configGroupShow,
        [groupType]: !this.state.configGroupShow[groupType]
      }
    });
  }

  // 切换tab
  handleChangeTabStatus(tabStatus) {
    if (this.state.tabStatus !== tabStatus) {
      this.setState({
        tabStatus
      })
    }
  }

  // 过滤掉不能发起联动的图表
  diagramFilter(list) {
    const newList = []
    if (Array.isArray(list) && list.length > 0) {
      list.forEach((item) => {
        // 过滤掉非联动类型以及设置了穿透的图
        if (SELECTOR_CHART_TYPE.indexOf(item.chart_code) > -1 && (!Array.isArray(item.layers) || item.layers.length === 0)) {
          newList.push(item)
        }
      })
    }
    return newList
  }

  // 过滤掉不能被联动的图表
  diagramTriggeredFilter(list) {
    const newContainer = {}
    const newList = _.cloneDeep(list)
    const { diagramList } = this.state
    // 过滤掉简单类型、筛选器、自己以及不同数据集的数据
    diagramList.forEach((item) => {
      const filterList = _.filter(newList, diagram => (
        SIMPLE_TYPES.indexOf(diagram.chart_code) === -1
        && FILTER_TYPES.indexOf(diagram.chart_code) === -1
        && item.chart_type !== 'auxiliary'
        && item.chart_type !== 'filter'
        && item.id !== diagram.id
        && item.source === diagram.source
      ))
      newContainer[item.id] = filterList
    })
    this.setState({
      selectorContainer: newContainer
    })
  }

  // 开始上传封面
  _coverUploadStart() {
    this.setState({
      coverPending: true
    })
  }

  // 封面上传成功
  _coverUploadSucc(url) {
    this.setState({
      cover: url,
      coverPending: false
    })
  }

  // 封面上传失败
  _coverUploadFailure() {
    this.setState({
      coverPending: false
    })
  }

  // 获取完整的设置数据
  _getDesignOption() {
    return {
      layout: this.state.layout,
      background: this.state.background
    }
  }

  STYLE_SHEET = {
    chartName: {
      height: '41px',
      borderBottom: '1px solid #1B2644',
      padding: '0 15px 0 13px',
      lineHeight: '40px',
      color: '#FFFFFF',
      fontSize: '14px'
    },
    title: {
      position: 'relative',
      paddingLeft: '30px',
      height: '30px',
      lineHeight: '29px',
      fontSize: '14px',
      cursor: 'pointer',
      borderBottomStyle: 'solid',
      borderBottomWidth: '1px'
    },
    selectText: {
      position: 'absolute',
      left: '104px',
      lineHeight: '30px',
      zIndex: 1
    },
    spreadIcon: {
      right: 'initial',
      left: '12px',
      marginTop: '-2px',
      transition: 'transform .3s'
    },
    groupCommon: {
      transition: 'all .3s',
      borderBottomStyle: 'solid',
    },
    configColumn: {
      lineHeight: '30px',
      fontSize: '12px',
      width: '100%',
      height: '40px',
      position: 'relative',
      padding: '0 0 10px 94px'
    },
    configColumnTitle: {
      position: 'absolute',
      left: 0,
      lineHeight: '30px'
    },
    pxUnit: {
      position: 'absolute',
      right: 0,
      lineHeight: '30px'
    },
    customSelectEdit: {
      position: 'absolute',
      right: 0,
      top: '13px',
      lineHeight: '30px',
      fontSize: '14px',
      color: '#58678E'
    },
    colorPickerBtn: {
      width: '30px',
      height: '30px',
      position: 'absolute',
      right: 0,
      top: 0,
      borderWidth: '1px',
      padding: '1px',
      borderStyle: 'solid',
    },
    colorPickerIcon: {
      position: 'absolute',
      right: '-4px',
      bottom: '-4px',
      transform: 'rotateZ(-45deg)',
      fontSize: '12px'
    },
    // 颜色选择的输入框
    colorPickInputContainer: {
      width: '100%',
      height: '100%',
      padding: '0 30px 0 0'
    },
    colorPickInput: {
      width: '100%',
      height: '100%',
      lineHeight: '30px',
      padding: '0 10px'
    },
    // SWITCH BTN
    switchBtn: {
      width: '34px',
      height: '14px',
      lineHeight: '14px',
      float: 'right',
      right: '14px',
      top: '8px'
    },
    loadingStyle: {
      fontSize: '12px',
      position: 'absolute',
      left: '50%',
      top: '50%',
      marginLeft: '-6px',
      marginTop: '-6px'
    }
  }
}

export default LayoutConfigPanel;
