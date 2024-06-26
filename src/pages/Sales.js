import GeneratorCrud from "../components/GeneratorCrud";

const Sales = () => {
  const field = [
    {
      name: "id",
      required: true,
      type_form: "input",
      type_input: "number",
      max_length: 5,
      min_length: 1,
      api: "",
      primary_key: true,
      searchable: true,
    },
    {
      name: "name",
      required: true,
      type_form: "input",
      type_input: "text",
      max_length: 100,
      min_length: 1,
      api: "",
      primary_key: false,
      searchable: true,
    },
  ];
  return <GeneratorCrud field={field} />;
};
export default Sales;
