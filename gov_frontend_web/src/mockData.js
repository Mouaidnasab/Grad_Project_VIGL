export const initialMockSupermarketsData = [
  { id: 'sm001', name: 'FreshMart Central', owner: 'John Doe', location: '123 Main St, Anytown', contactPerson: 'Jane Smith', contactEmail: 'jane.s@freshmart.com' },
  { id: 'sm002', name: 'GreenWay Groceries', owner: 'Alice Wonderland', location: '456 Oak Ave, Anytown', contactPerson: 'Bob Builder', contactEmail: 'bob.b@greenway.com' },
  { id: 'sm003', name: 'QuickStop Corner', owner: 'Charlie Brown', location: '789 Pine Ln, Otherville', contactPerson: 'Lucy VanPelt', contactEmail: 'lucy.vp@quickstop.com' },
];

export const mockProductsData = {
  sm001: [
    { id: 'p101', name: 'Organic Apples', category: 'Fruits', price: 2.99, stock: 150 },
    { id: 'p102', name: 'Whole Milk', category: 'Dairy', price: 3.49, stock: 80 },
    { id: 'p103', name: 'Sourdough Bread', category: 'Bakery', price: 4.50, stock: 40 },
  ],
  sm002: [
    { id: 'p201', name: 'Free-Range Eggs', category: 'Dairy', price: 5.20, stock: 100 },
    { id: 'p202', name: 'Spinach Bunch', category: 'Vegetables', price: 2.00, stock: 120 },
  ],
  sm003: [
    { id: 'p301', name: 'Cola Cans (6-pack)', category: 'Beverages', price: 6.00, stock: 200 },
    { id: 'p302', name: 'Potato Chips', category: 'Snacks', price: 3.75, stock: 90 },
  ],
};

export const mockPenaltiesData = {
  sm001: [
    { id: 'pen01', date: '2024-05-10', reason: 'Expired products on shelf', amount: 75.00, status: 'Paid' },
  ],
  sm002: [
    { id: 'pen02', date: '2024-04-22', reason: 'Incorrect price tagging', amount: 50.00, status: 'Pending' },
    { id: 'pen03', date: '2024-03-15', reason: 'Health code violation - minor', amount: 120.00, status: 'Paid' },
  ],
};