import React from "react";

// Humne ek interface banaya jo checkbox ka props define karega
interface CheckboxProps {
  text: string;
  isChecked: boolean;
}

// Ab is interface ko props mein lagaya proper tareeke se
const Checkbox = ({ text = "No", isChecked = false }: CheckboxProps) => {
  return (
    <>
      {isChecked ? (
        <label className="inline-flex items-center space-x-1 ml-4">
          {/* Agar checked hai toh tick mark dikhayenge */}
          [✔️]
          <span>&nbsp;{text}</span>
        </label>
      ) : (
        <label className="inline-flex items-center space-x-1 ml-4">
          {/* Agar unchecked hai toh khali box dikhayenge */}[ ]
          <span>&nbsp;{text}</span>
        </label>
      )}
    </>
  );
};

export default Checkbox;
