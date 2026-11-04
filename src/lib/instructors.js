// The two lesson instructors children can choose from.
export const INSTRUCTORS = {
  female: { id: 'female', name: 'Auntie Akos', emoji: '👩🏾‍🏫', hello: 'Hello! I am Auntie Akos. Let us learn together!' },
  male: { id: 'male', name: 'Uncle Kwame', emoji: '👨🏾‍🏫', hello: 'Hello! I am Uncle Kwame. Let us learn together!' },
};
export const instructorOf = (child) => INSTRUCTORS[child?.instructor] || INSTRUCTORS.female;
