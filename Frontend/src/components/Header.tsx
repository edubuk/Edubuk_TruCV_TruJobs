import HyperText from "./ui/AnimateHypertext";
import logo from "../assets/EdubukLogoClean.png";

const Header = () => {
  return (
    <div className="border flex items-center justify-center  px-10 py-2">
      <img
        src={logo}
        alt="logo"
        className="md:h-16 md:w-16 h-10 w-10 object-cover"
        draggable={false}
      />
      <div className="ml-5">
        <HyperText
          text="CV ON BLOCKCHAIN BY EDUBUK"
          className="text-xl md:text-4xl font-semibold text-[#006666]"
        />
      </div>
    </div>
  );
};

export default Header;
