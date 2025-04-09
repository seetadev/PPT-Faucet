const hre = require('hardhat')

async function main(){

  const contract = await hre.ethers.deployContract("FaucetPPT",["0xc76F004CB35ec0971075060D4DBd6279d2252Acf"])
  await contract.waitForDeployment();

  console.log("Contract deployed at : ",contract.target);

  console.log("Waiting 30 seconds before verification...")
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  await hre.run("verify:verify",{
    address : contract.target,
    constructorArguments : ["0xc76F004CB35ec0971075060D4DBd6279d2252Acf"]
  })

}


main()
.then(()=>{process.exit(0)})
.catch((error)=>{
  console.log(error);
  process.exit(1);
})