#[macro_use]
extern crate diesel;
use actix::*;
use actix_cors::Cors;
use actix_files::Files;
use actix_web::{web, http, App, HttpServer};
use diesel::{
    prelude::*,
    r2d2::{self, ConnectionManager},
};
mod db;
mod models;
mod routes;
mod schema;
mod server;
mod session;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // get server connection
    let server = server::ChatServer::new().start();
    let conn_spec = std::env::var("DATABASE_URL").unwrap_or_else(|_| "chat.db".to_string());
    let manager = ConnectionManager::<SqliteConnection>::new(conn_spec);
    let pool = r2d2::Pool::builder().build(manager).expect("Failed to create pool");
    let server_addr = "0.0.0.0";
    let server_port = 8080;
    
    let app = HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allowed_headers(vec![http::header::AUTHORIZATION, http::header::ACCEPT])
            .allowed_header(http::header::CONTENT_TYPE)
            .max_age(3600);
        App::new()
            .app_data(web::Data::new(server.clone()))
            .app_data(web::Data::new(pool.clone()))
            .wrap(cors)
            .service(web::resource("/").to(routes::index))
            .route("/ws", web::get().to(routes::chat_server))
            .service(routes::create_user)
            .service(routes::get_user_by_id)
            .service(routes::get_user_by_phone)
            .service(routes::get_conversation_by_id)
            .service(routes::get_rooms)
            .service(routes::create_room)
            .service(routes::get_users)
            .service(Files::new("/", "./static"))
    })
    .workers(2)
    .bind((server_addr, server_port))?
    .run();
    println!("Server running at http://{server_addr}:{server_port}/");
    app.await
}
