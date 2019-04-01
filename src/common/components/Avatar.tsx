import { Image, IImageProps } from "office-ui-fabric-react/lib/Image";
import styled, { StyledComponent } from "styled-components";
import { GetProps } from "@/common/kit/types";
import colors from "@/common/styles/colors";

const Avatar: StyledComponent<
  React.FunctionComponent<IImageProps>,
  any,
  { offline?: boolean },
  never
> = styled(Image)`
  border-radius: 2px;
  filter: ${(props: GetProps<typeof Avatar>) =>
    props.offline ? "grayscale(100%)" : "grayscale(0%)"};
  border: 1px solid #00000010;
`;

export default Avatar;
