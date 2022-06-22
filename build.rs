// generate binary client for health checking
fn main() -> Result<(), Box<dyn std::error::Error>> {
    tonic_build::compile_protos("./node_modules/@a11ywatch/protos/health.proto")?;

    Ok(())
}
