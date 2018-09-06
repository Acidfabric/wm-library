import { AsyncStorage } from 'react-native';

export default {
  async initStorage() {
    const initBooks = [
      { qr: '2', name: 'THE LEVITAN PITCH', isAvailable: true },
      { qr: '1', name: 'YES TO THE MESS', isAvailable: true }
    ];
    const initUsers = [
      {
        name: 'Karolis',
        faceId: '84246a55-910a-4665-ba5b-4a6605274cba',
        books: []
      },
      {
        name: 'Thomas, also known as Lebron',
        faceId: 'e28c79f8-106e-44a5-948a-c8ee782a1080',
        books: []
      },
      {
        name: 'Indre',
        faceId: '6a79a85a-adb6-45f7-a208-3179fc25dabd',
        books: []
      },
      {
        name: 'Arminas',
        faceId: '778249a5-83fa-4be8-bee7-498eec197bee',
        books: []
      },
      {
        name: 'Domas',
        faceId: 'bfc77a3d-db96-4720-bb97-809fc00e9a74',
        books: []
      },
      {
        name: 'Danas',
        faceId: 'e28c79f8-106e-44a5-948a-c8ee782a1080',
        books: []
      }
    ];

    try {
      const storedUsers = await AsyncStorage.getItem('@DanskeLibrary:Users');
      if (!storedUsers) {
        await AsyncStorage.setItem('@DanskeLibrary:Users', JSON.stringify(initUsers));
        await AsyncStorage.setItem('@DanskeLibrary:Books', JSON.stringify(initBooks));
      }

      return { success: true };
    } catch (error) {
      console.log(error);
    }
  },

  async getAllBooks() {
    try {
      const storedBooks = await AsyncStorage.getItem('@DanskeLibrary:Books');
      const booksArr = await JSON.parse(storedBooks);

      return { books: booksArr };
    } catch (error) {
      console.log(error);
    }
  },

  async getAllUsers() {
    try {
      const storedUsers = await AsyncStorage.getItem('@DanskeLibrary:Users');
      const usersArr = await JSON.parse(storedUsers);

      return { users: usersArr };
    } catch (error) {
      console.log(error);
    }
  },

  async manageBook(request) {
    console.log('manageBook', request);
    const { faceId, bookQr } = request;

    try {
      const storedBooks = await AsyncStorage.getItem('@DanskeLibrary:Books');
      const storedUsers = await AsyncStorage.getItem('@DanskeLibrary:Users');

      const booksArr = JSON.parse(storedBooks);
      const usersArr = JSON.parse(storedUsers);

      const userFound = usersArr.find(user => {
        return user.faceId === faceId;
      });

      if (!userFound) {
        return { success: false, message: "user doesn't exist" };
      }

      const bookFound = booksArr.find(book => {
        return book.qr === bookQr;
      });

      if (!bookFound) {
        return { success: false, message: "this book doesn't exist in the library" };
      }

      const userHasThisBook = userFound.books.find(book => {
        return book === bookQr;
      });

      const userIndex = usersArr.indexOf(userFound);
      const bookIndex = booksArr.indexOf(bookFound);

      if (bookFound && bookFound.isAvailable) {
        userFound.books.push(bookQr);
        bookFound.isAvailable = false;

        usersArr[userIndex] = userFound;
        booksArr[bookIndex] = bookFound;

        try {
          await AsyncStorage.setItem('@DanskeLibrary:Users', JSON.stringify(usersArr));
          await AsyncStorage.setItem('@DanskeLibrary:Books', JSON.stringify(booksArr));

          return {
            success: true,
            message:
              'Congratulations ' +
              userFound.name +
              '! You have taken the book. Enjoy reading ' +
              bookFound.name
          };
        } catch (error) {
          console.log(error);
        }
      } else if (userHasThisBook) {
        const usersBookIndex = userFound.books.indexOf(userHasThisBook);

        if (usersBookIndex !== -1) {
          userFound.books.splice(usersBookIndex);
          bookFound.isAvailable = true;
        }

        usersArr[userIndex] = userFound;
        booksArr[bookIndex] = bookFound;

        try {
          await AsyncStorage.removeItem('@DanskeLibrary:Users');
          await AsyncStorage.removeItem('@DanskeLibrary:Books');

          await AsyncStorage.setItem('@DanskeLibrary:Users', JSON.stringify(usersArr));
          await AsyncStorage.setItem('@DanskeLibrary:Books', JSON.stringify(booksArr));

          return {
            success: true,
            message:
              'Congratulations ' +
              userFound.name +
              '! You have returned the book - ' +
              bookFound.name
          };
        } catch (error) {
          console.log(error);
        }
      } else {
        return { success: false, message: 'Sorry, ' + userFound.name + ', book is not available' };
      }
    } catch (error) {
      console.log(error);
    }
  },

  async registration(request) {
    const { name, faceId } = request;
    const newUser = { name, faceId, books: [] };

    try {
      const storedUsers = await AsyncStorage.getItem('@DanskeLibrary:Users');
      if (storedUsers) {
        let existingUsers = JSON.parse(storedUsers);
        existingUsers.push(newUser);

        try {
          await AsyncStorage.setItem('@DanskeLibrary:Users', JSON.stringify(existingUsers));

          return { success: true };
        } catch (error) {
          console.log(error);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
};
