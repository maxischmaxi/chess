use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use std::time::Duration;

pub async fn create_pool(database_url: &str) -> Result<PgPool, sqlx::Error> {
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(15))
        .test_before_acquire(true)
        .connect(database_url)
        .await;

    match pool {
        Ok(p) => Ok(p),
        Err(_) => {
            // Neon cold-start retry with exponential backoff
            let delays = [500, 1000, 2000];
            let mut last_err = None;
            for delay_ms in delays {
                tracing::info!("Retrying DB connection in {delay_ms}ms...");
                tokio::time::sleep(Duration::from_millis(delay_ms)).await;
                match PgPoolOptions::new()
                    .max_connections(5)
                    .acquire_timeout(Duration::from_secs(15))
                    .test_before_acquire(true)
                    .connect(database_url)
                    .await
                {
                    Ok(p) => return Ok(p),
                    Err(e) => last_err = Some(e),
                }
            }
            Err(last_err.unwrap())
        }
    }
}
