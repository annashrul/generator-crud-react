import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Button,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  Layout,
  Modal,
  Row,
  Select,
  Space,
  Table,
  theme,
  Spin,
} from "antd";
import dayjs from "dayjs";
import debounce from "lodash/debounce";
import { InfoCircleOutlined } from "@ant-design/icons";
import axios from "axios";
const { Option } = Select;
const { Content } = Layout;
function capitalizeWords(input) {
  return input
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function currencyFormat(num) {
  return num.toFixed(0).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

const GeneratorCrud = ({ field }) => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const [form] = Form.useForm();
  const page = capitalizeWords(window.location.pathname.replaceAll("/", ""));
  const [responseJSON, setResponseJSON] = useState({ page, field });

  const strData = `dataGenerator${page}`;
  const [isModalForm, setIsModalForm] = useState(false);
  const [isModalConfirmCancel, setIsModalConfirmCancel] = useState(false);
  const [isModalConfirmDelete, setIsModalConfirmDelete] = useState(false);

  const [isActionCopy, setIsActionCopy] = useState(false);
  const [isActionChanges, setIsActionChanges] = useState(false);

  const [dataDetail, setDataDetail] = useState(null);
  const [dataTable, setDataTable] = useState([]);
  const [dataSearch, setDataSearch] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    if (localStorage[strData]) {
      setDataTable(JSON.parse(localStorage[strData]));
    }
  }, []);

  const columns = responseJSON.field.map((item, index) => {
    const renderFunc = (val) => {
      if (item.name.includes("price")) {
        return currencyFormat(Number(val));
      } else if (item.name.includes("date")) {
        return dayjs(val).format("DD-MM-YYYY");
      }
      return val;
    };

    return {
      title: item.name.toUpperCase(),
      dataIndex: item.name,
      key: index,
      render: renderFunc,
      ...(item.name === "id" ? { fixed: "left" } : {}),
    };
  });

  columns.push({
    fixed: "right",
    title: "ACTION",
    key: "action",
    render: (val, rec, index) => (
      <Space>
        <Button
          type="primary"
          onClick={(e) => {
            e.stopPropagation();
            setDataDetail(rec);
            setIsModalForm(true);
          }}
        >
          Detail
        </Button>
      </Space>
    ),
  });
  useEffect(() => {
    if (dataDetail !== null) {
      const keyDetail = Object.keys(dataDetail);
      if (keyDetail.includes("date")) {
        Object.assign(dataDetail, {
          date: dayjs(dataDetail.date),
          key: dataDetail.key,
        });
      }
      form.setFieldsValue(dataDetail);
      setDataTable(JSON.parse(localStorage[strData]));
    }
  }, [dataDetail !== null]);

  const handleSearch = (e) => {
    const searchVal = e.target.value;
    setDataSearch(searchVal);
  };

  const onCloseForm = () => {
    if (dataDetail !== null) {
      const objDetail = Object.entries(dataDetail);
      const fieldForm = form.getFieldsValue();

      if (Object.keys(fieldForm).includes("date")) {
        fieldForm.date = dayjs(fieldForm.date);
      }
      const objForm = Object.entries(fieldForm);

      if (objForm.sort().toString() === objDetail.sort().toString()) {
        setDataDetail(null);
        form.resetFields();
        setIsActionChanges(false);
        setIsActionCopy(false);
        setIsModalForm(false);
      } else {
        setIsModalConfirmCancel(true);
      }
    } else {
      const checkIsEmpty = Object.entries(form.getFieldsValue()).filter(
        ([key, value]) => value
      );

      if (checkIsEmpty.length > 0) {
        setIsModalConfirmCancel(true);
      } else {
        setIsModalForm(false);
      }
    }
  };

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const setStorage = (row) => {
    localStorage.setItem(strData, JSON.stringify(row));
  };

  const handleSubmit = (values) => {
    if (Object.keys(values).includes("date")) {
      const newDate = values.date ? values.date.format("YYYY-MM-DD") : "";
      Object.assign(values, { date: newDate });
    }

    let newData = dataTable.map((item) => {
      if (isActionCopy && item.key === dataDetail.key) {
        return { ...values, key: Math.random() };
      }
      if (isActionChanges && item.key === values.key) {
        return values;
      }
      return item;
    });

    if (!isActionCopy && !isActionChanges) {
      newData = [...newData, { ...values, key: Math.random() }];
    }
    form.resetFields();
    setDataTable(newData);
    setStorage(newData);
    onSelectChange([]);
    setDataDetail(null);
    setIsModalForm(false);
    setIsActionCopy(false);
    setIsActionChanges(false);
  };

  const handleDelete = () => {
    setIsModalConfirmDelete(false);
    setDataDetail(null);
    const newData =
      selectedRowKeys.length > 0
        ? dataTable.filter((item) => !selectedRowKeys.includes(item.key))
        : dataTable.filter((item) => item.key !== dataDetail.key);
    setDataTable(newData);
    setStorage(newData);
    onSelectChange([]);
  };

  const handleAdd = () => {
    setIsModalForm(true);
    setDataDetail(null);
    form.resetFields();
  };
  const handleCopy = () => {
    setIsActionCopy(true);
    setIsActionChanges(true);
    setDataDetail(
      dataTable.filter((item) => item.key === selectedRowKeys[0])[0]
    );
    setIsModalForm(true);
  };

  const fieldSearch = responseJSON.field
    .filter((item) => item.searchable)
    .map((item) => item.name);

  const filteredData = dataTable.filter((item) =>
    fieldSearch.some((field) =>
      item[field].toString().toLowerCase().includes(dataSearch.toLowerCase())
    )
  );
  const [fetching, setFetching] = useState(false);
  const [dataOption, setDataOption] = useState([]);
  const [debounceTimeout, setDebounceTimeout] = useState(0);

  const fetchData = async (value, api, index) => {
    let newData = responseJSON;
    if (!value) {
      newData.field[index].options = [];
      setResponseJSON(newData);
      return;
    }
    setFetching(true);
    try {
      const response = await axios.get(api);
      const users = response.data.results.map((user) => ({
        value: user.login.uuid,
        label: `${user.name.first} ${user.name.last}`,
      }));

      newData.field[index].options = users;
      setResponseJSON(newData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setFetching(false);
  };

  return (
    <React.Fragment>
      <Content style={{}}>
        <div
          style={{
            background: colorBgContainer,
            minHeight: 280,
            padding: 24,
            borderRadius: borderRadiusLG,
          }}
        >
          <Row align={"middle"} justify={"end"} gutter={12}>
            <Col lg={6}>
              <Input
                placeholder={`search by ${fieldSearch.join(", ")}`}
                onChange={handleSearch}
              />
            </Col>
            <Col>
              <Button type="primary" onClick={handleAdd}>
                Add
              </Button>
              &nbsp;
              <Button
                disabled={selectedRowKeys.length !== 1}
                type="dashed"
                onClick={handleCopy}
              >
                Copy
              </Button>
              &nbsp;
              <Button
                disabled={selectedRowKeys.length === 0}
                danger
                type="primary"
                onClick={() => {
                  setIsModalConfirmDelete(true);
                }}
              >
                Delete
                {selectedRowKeys.length > 0
                  ? ` (${selectedRowKeys.length})`
                  : ""}
              </Button>
            </Col>
          </Row>
          <br />
          <Table
            size="small"
            scroll={{ x: "max-content" }}
            rowKey={"key"}
            onRow={(record, rowIndex) => {
              return {
                onClick: (event) => {
                  const newSelected = selectedRowKeys.includes(record.key)
                    ? selectedRowKeys.filter((item) => item !== record.key)
                    : [...selectedRowKeys, record.key];

                  onSelectChange(newSelected);
                }, // click row
              };
            }}
            rowSelection={{
              selectedRowKeys,
              onChange: onSelectChange,
              getCheckboxProps: (record) => ({
                disabled: record.category === "makanan",
                // Column configuration not to be checked
                // name: record.name,
              }),
            }}
            dataSource={filteredData}
            columns={columns}
          />
        </div>
      </Content>

      <Modal
        title={`Form ${responseJSON.page}`}
        open={isModalForm}
        closeIcon={false}
        onCancel={() => {}}
        footer={null}
      >
        <Form
          labelCol={{
            span: 6,
          }}
          wrapperCol={{
            span: 17,
          }}
          layout="horizontal"
          form={form}
          onFinish={handleSubmit}
        >
          <Form.Item style={{ display: "none" }} name="key">
            <Input />
          </Form.Item>
          <div
            style={{
              maxHeight: "60vh",
              overflow: "auto",
            }}
          >
            {responseJSON.field.map((item, index) => {
              const {
                primary_key,
                name,
                max_length,
                min_length,
                required,
                type_input,
                type_form,
                options,
                api,
              } = item;

              const isDisabled =
                (dataDetail !== null && !isActionChanges && !isActionCopy) ||
                (primary_key && dataDetail !== null && !isActionCopy);

              const propsInput = {
                showCount: max_length || 0 > 0,
                maxLength: max_length,
                minLength: min_length,
              };
              const rules = [
                {
                  required: required,
                  message: `field ${name} is required`,
                },
              ];
              if (type_input === "number") {
                rules.push({
                  pattern: /^(?:\d*)$/,
                  message: "Value should contain just number",
                });
              }
              return (
                <Form.Item
                  tooltip={
                    primary_key && {
                      title: "Ini adalah primary key",
                      icon: <InfoCircleOutlined />,
                    }
                  }
                  name={name}
                  hasFeedback
                  label={name}
                  rules={rules}
                  key={index}
                >
                  {type_form === "input" ? (
                    <Input disabled={isDisabled} {...propsInput} />
                  ) : type_form === "select" && api === "" ? (
                    <Select options={options} disabled={isDisabled} />
                  ) : type_form === "date" ? (
                    <DatePicker
                      style={{ width: "100%" }}
                      disabled={isDisabled}
                    />
                  ) : type_form === "textarea" ? (
                    <Input.TextArea disabled={isDisabled} {...propsInput} />
                  ) : type_form === "select" && api !== "" ? (
                    <Select
                      disabled={isDisabled}
                      showSearch
                      labelInValue
                      filterOption={false}
                      onChange={(e) => {
                        form.setFieldValue(item.name, e.label);
                      }}
                      onSearch={(e) => {
                        clearTimeout(debounceTimeout);
                        const newDebounceTimeout = setTimeout(() => {
                          fetchData(e, item.api + `&name=${e}`, index);
                        }, 700);
                        setDebounceTimeout(newDebounceTimeout);
                      }}
                      notFoundContent={fetching ? <Spin size="small" /> : null}
                      style={{ width: "100%" }}
                    >
                      {options.map((user) => (
                        <Option key={user.value} value={user.value}>
                          {user.label}
                        </Option>
                      ))}
                    </Select>
                  ) : null}
                </Form.Item>
              );
            })}
          </div>
          <Divider />

          <Row align={"middle"} justify={"space-between"}>
            <Space>
              {dataDetail !== null && !isActionCopy && (
                <Button
                  type="primary"
                  onClick={(e) => setIsActionChanges(!isActionChanges)}
                >
                  {isActionChanges ? "View" : "Changes"}
                </Button>
              )}
            </Space>
            <div>
              <Button type="default" htmlType="button" onClick={onCloseForm}>
                Cancel
              </Button>
              &nbsp;
              <Button
                type="primary"
                htmlType="submit"
                disabled={!isActionChanges && dataDetail !== null}
              >
                Submit
              </Button>
            </div>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Confirm Cancellation"
        open={isModalConfirmCancel}
        closeIcon={false}
        onOk={() => {
          setIsModalConfirmCancel(false);
          setIsModalForm(false);
          setDataDetail(null);
          setIsActionChanges(false);
          setIsActionCopy(false);
        }}
        onCancel={() => {
          setIsModalConfirmCancel(false);
          setIsModalForm(true);
        }}
      >
        Are you sure want to cancel? Change you made so far will not saved
      </Modal>

      <Modal
        title="Confirm Delete"
        open={isModalConfirmDelete}
        closeIcon={false}
        onOk={handleDelete}
        onCancel={() => {
          setIsModalConfirmDelete(false);
          setDataDetail(null);
        }}
      >
        Are you sure want Delete {responseJSON.page}{" "}
        <b>
          {dataTable
            .filter((item) => selectedRowKeys.includes(item.key))
            .map((item) => item.name)
            .join(", ")}
        </b>
        ?
      </Modal>
    </React.Fragment>
  );
};
export default GeneratorCrud;
