# BakeFlow Backend

This is the backend service for the CAKE_HUB project.

## Features

- RESTful API for cake management
- User authentication and authorization
- Order processing
- Database integration

## Technologies

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT for authentication

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/CAKE_HUB.git
   cd CAKE_HUB/backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables in a `.env` file:

   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

| Method | Endpoint       | Description    |
| ------ | -------------- | -------------- |
| GET    | /cakes         | List all cakes |
| POST   | /cakes         | Add a new cake |
| POST   | /auth/register | Register user  |
| POST   | /auth/login    | User login     |
| POST   | /orders        | Place an order |

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

## License

[MIT](LICENSE)
