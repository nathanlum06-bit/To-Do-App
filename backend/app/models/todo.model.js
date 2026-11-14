export default (sequelize, Sequelize) => {
  const Todo = sequelize.define("todo", {
    title: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    completed: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    dueDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
      get() {
        const value = this.getDataValue("dueDate");

        if (!value) {
          return null;
        }

        if (value instanceof Date) {
          const year = value.getFullYear();
          const month = String(value.getMonth() + 1).padStart(2, "0");
          const day = String(value.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        }

        return String(value).slice(0, 10);
      },
    },
    listId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  });

  return Todo;
};
