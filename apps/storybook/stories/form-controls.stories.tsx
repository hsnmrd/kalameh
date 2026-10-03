import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, userEvent, within } from "storybook/test"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { PasswordInput } from "@workspace/ui/components/password-input"
import { PriceInput } from "@workspace/ui/components/price-input"

const meta = {
  title: "Inputs/Form Controls",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const FormStates: Story = {
  render: () => (
    <FieldGroup className="mx-auto max-w-md">
      <Field>
        <FieldLabel htmlFor="storybook-name">Display name</FieldLabel>
        <Input
          id="storybook-name"
          placeholder="Enter a name"
          defaultValue="Kalameh Academy"
        />
        <FieldDescription>Visible to students and staff.</FieldDescription>
      </Field>

      <Field data-invalid>
        <FieldLabel htmlFor="storybook-phone">Phone number</FieldLabel>
        <Input
          id="storybook-phone"
          aria-invalid
          aria-describedby="storybook-phone-error"
          defaultValue="invalid phone"
        />
        <FieldError id="storybook-phone-error">
          Enter a valid mobile number.
        </FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor="storybook-password">Password</FieldLabel>
        <PasswordInput
          id="storybook-password"
          defaultValue="storybook-password"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="storybook-fee">Tuition fee</FieldLabel>
        <PriceInput id="storybook-fee" locale="en" defaultValue={1500000} />
      </Field>

      <Field className="flex-row items-center gap-3">
        <Checkbox id="storybook-terms" />
        <FieldLabel htmlFor="storybook-terms">
          I accept the institute terms
        </FieldLabel>
      </Field>
    </FieldGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const checkbox = canvas.getByRole("checkbox", {
      name: "I accept the institute terms",
    })

    await userEvent.click(checkbox)
    await expect(checkbox).toBeChecked()
  },
}

export const RtlContent: Story = {
  globals: {
    direction: "rtl",
  },
  render: () => (
    <FieldGroup className="mx-auto max-w-md">
      <Field>
        <FieldLabel htmlFor="storybook-fa-name">نام آموزشگاه</FieldLabel>
        <Input
          id="storybook-fa-name"
          placeholder="نام آموزشگاه را وارد کنید"
          defaultValue="آموزشگاه زبان کلمه"
        />
        <FieldDescription>
          این نام برای فراگیران و پرسنل نمایش داده می‌شود.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="storybook-fa-password">رمز عبور</FieldLabel>
        <PasswordInput
          id="storybook-fa-password"
          placeholder="رمز عبور خود را وارد کنید"
          defaultValue="راز_محرمانه_۱۲۳"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="storybook-fa-fee">شهریه دوره</FieldLabel>
        <PriceInput id="storybook-fa-fee" locale="fa" defaultValue={2500000} />
      </Field>
    </FieldGroup>
  ),
}
