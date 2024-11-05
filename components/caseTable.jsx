import { useState } from 'react';
import { Table, Td, Th, Tr } from 'nextra/components'


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

      <Table>
        <thead>
          <Tr>
            <Th>Color</Th>
            <Th>SKU</Th>
            <Th>Tap for more:</Th>
          </Tr>
        </thead>
        <tbody>
          {sortedCases.map((item) => (
            <Tr key={item.sku}>
              <Td>{item.color}</Td>
              <Td>{item.sku}</Td>
              <Td>
                <a href={`/latest-iphone/iphone-12/${item.sku}`}>
                  <img src={item.image} alt={item.color} />
                </a>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </>
  );
};

export default CaseTable;