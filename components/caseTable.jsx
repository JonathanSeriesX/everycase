import { useState } from 'react';

const CaseTable = ({ cases }) => {
  const [sortField, setSortField] = useState('color');

  const sortedCases = [...cases].sort((a, b) => {
    if (a[sortField] < b[sortField]) return -1;
    if (a[sortField] > b[sortField]) return 1;
    return 0;
  });

  return (
    <>
      <select onChange={(e) => setSortField(e.target.value)}>
        <option value="color">Sort by Color</option>
        <option value="sku">Sort by SKU</option>
      </select>

      <table>
        <thead>
          <tr>
            <th>Color</th>
            <th>SKU</th>
            <th>Tap for more:</th>
          </tr>
        </thead>
        <tbody>
          {sortedCases.map((item) => (
            <tr key={item.sku}>
              <td>{item.color}</td>
              <td>{item.sku}</td>
              <td>
                <a href={`/latest-iphone/iphone-12/${item.sku}`}>
                  <img src={item.image} alt={item.color} />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default CaseTable;