import React from 'react'
import PropTypes from 'prop-types'
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Button from 'react-bootstrap-myui/lib/Button';
import Row from 'react-bootstrap-myui/lib/Row';
import Col from 'react-bootstrap-myui/lib/Col';
import { Form, ValidatedInput } from '../../../components/bootstrap-validation';

class CreateTableDialog extends React.Component {
  static propTypes = {
    show: PropTypes.bool,
    onHide: PropTypes.func,
    onExecSql: PropTypes.func,
    /**
     * sql 
     */
    sql: PropTypes.string,
    pending: PropTypes.bool
  };

  static defaultProp = {
    show: false,
    sql: ''
  };

  constructor(props) {
    super(props);
    this.state = {
      uuid: new Date().getTime(),
      sql: props.sql
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps) {
      this.setState({
        sql: nextProps.sql
      })
    }
  }

  render() {
    const { show, onHide } = this.props
    const { sql, uuid } = this.state
    return (
      <Dialog
        show={show}
        onHide={onHide}
        backdrop="static"
        size={{ width: '600px' }}
        className="data-view-dispatch-config-dialog"
        id="data-view-dispatch-config-dialog"
      >
        <Dialog.Header closeButton>
          <Dialog.Title>自动建表</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Form className="form-horizontal"
            validationEvent="onBlur"
            onValidSubmit={this.handleExecSql.bind(this)}
            ref={(instance) => { this.database_form = instance }}
            id={`sql_form_${uuid}`}
          >
            <Row>
              <Col md={12} style={{ textAlign: 'left', paddingRight: '5px', marginBottom: '10px' }}>
                <i className="required" style={{ color: '#FA4747' }}>*</i>sql语句</Col>
              <Col md={12}>
                <ValidatedInput
                  type="textarea"
                  autoComplete="off"
                  name="sql"
                  style={{ height: '300px' }}
                  value={sql || ''}
                  onChange={this.handleChangeSql.bind(this)}
                  wrapperClassName="form-group"
                  validate='required'
                  errorHelp={{
                    required: '请输入sql语句'
                  }}
                />
              </Col>
            </Row>
          </Form>
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary" onClick={() => { this.database_form.submit() }}>执行</Button>
          <Button bsStyle="default" onClick={onHide}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    );
  }

  handleChangeSql(e) {
    this.setState({
      ...this.state,
      sql: e.target.value
    })
  }

  handleExecSql() {
    this.props.onExecSql(this.state.sql)
  }
}


export default CreateTableDialog;

