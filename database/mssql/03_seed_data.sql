USE CeylonParadiseDB;
GO

INSERT INTO dbo.Users (name, email, password, role)
VALUES
    ('Admin User', 'admin@ceylonparadise.com', 'admin123', 'admin'),
    ('Nimal Perera', 'nimal@example.com', 'guest123', 'customer'),
    ('Aisha Silva', 'aisha@example.com', 'guest123', 'customer');
GO

INSERT INTO dbo.Destinations (name, description, image_url, location)
VALUES
    ('Sigiriya Rock Fortress', 'Ancient rock fortress with panoramic views and stunning frescoes.', 'https://images.unsplash.com/photo-1548013146-72479768bada', 'Central Province'),
    ('Ella', 'Green hills, tea estates, waterfalls, and scenic railway routes.', 'https://images.unsplash.com/photo-1586611292716-98d9d0ef3f5f', 'Uva Province'),
    ('Galle Fort', 'Historic colonial fort with ocean views and charming town streets.', 'https://images.unsplash.com/photo-1528127269322-539801943592', 'Southern Province');
GO

INSERT INTO dbo.TourPackages (title, price, duration, description, category)
VALUES
    ('Cultural Triangle Escape', 220.00, '3 Days / 2 Nights', 'Explore Sri Lanka''s heritage sites including Sigiriya, Kandy, and Dambulla.', 'Cultural'),
    ('Ella Scenic Adventure', 310.00, '4 Days / 3 Nights', 'A scenic getaway filled with waterfalls, mountains, and train rides.', 'Adventure'),
    ('Southern Coast Retreat', 280.00, '3 Days / 2 Nights', 'Relax by the coast, discover Galle, and enjoy beach experiences.', 'Beach');
GO

INSERT INTO dbo.BookingInquiries (user_name, user_email, tour_id, date, status, notes)
VALUES
    ('Nimal Perera', 'nimal@example.com', 1, '2026-09-15', 'pending', 'Need an early morning pickup from Colombo.'),
    ('Aisha Silva', 'aisha@example.com', 2, '2026-09-20', 'confirmed', 'Interested in a private tour guide.'),
    ('John Fernando', 'john@example.com', 3, '2026-10-05', 'pending', 'Traveling with family of four.');
GO

PRINT 'Seed data inserted successfully.';
GO
